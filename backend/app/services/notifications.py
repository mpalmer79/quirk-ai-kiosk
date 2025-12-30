"""
Staff Notification Service
Sends real-time notifications via Slack and SMS when customers need assistance.

Configuration (environment variables):
- SLACK_WEBHOOK_SALES: Slack webhook for sales team
- SLACK_WEBHOOK_APPRAISAL: Slack webhook for appraisal team  
- SLACK_WEBHOOK_FINANCE: Slack webhook for finance team
- SLACK_WEBHOOK_DEFAULT: Fallback webhook if team-specific not set

- TWILIO_ACCOUNT_SID: Twilio account SID
- TWILIO_AUTH_TOKEN: Twilio auth token
- TWILIO_PHONE_NUMBER: Twilio phone to send from
- SMS_NOTIFY_SALES: Phone number(s) for sales (comma-separated)
- SMS_NOTIFY_APPRAISAL: Phone number(s) for appraisal
- SMS_NOTIFY_FINANCE: Phone number(s) for finance
"""

import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger("quirk_kiosk.notifications")


class NotificationService:
    """Handles sending notifications to staff via Slack and SMS"""
    
    def __init__(self, settings):
        self.settings = settings
        self._twilio_client = None
    
    @property
    def twilio_client(self):
        """Lazy-load Twilio client"""
        if self._twilio_client is None and self.settings.is_sms_configured:
            try:
                from twilio.rest import Client
                self._twilio_client = Client(
                    self.settings.twilio_account_sid,
                    self.settings.twilio_auth_token
                )
            except ImportError:
                logger.warning("Twilio package not installed. SMS notifications disabled.")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
        return self._twilio_client
    
    async def notify_staff(
        self,
        notification_type: str,
        message: str,
        session_id: str,
        vehicle_stock: Optional[str] = None,
        customer_name: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send notification to appropriate staff.
        
        Args:
            notification_type: "sales", "appraisal", or "finance"
            message: Brief description of what customer needs
            session_id: Kiosk session ID for reference
            vehicle_stock: Stock number of vehicle (if applicable)
            customer_name: Customer name (if known)
            additional_context: Extra info like budget, trade-in details
            
        Returns:
            Dict with status and details of notifications sent
        """
        results = {
            "slack_sent": False,
            "sms_sent": False,
            "errors": [],
            "notification_type": notification_type,
            "timestamp": datetime.now().isoformat()
        }
        
        # Build notification content
        notification = self._build_notification(
            notification_type=notification_type,
            message=message,
            session_id=session_id,
            vehicle_stock=vehicle_stock,
            customer_name=customer_name,
            additional_context=additional_context
        )
        
        # Send Slack notification
        slack_result = await self._send_slack(notification_type, notification)
        results["slack_sent"] = slack_result.get("success", False)
        if slack_result.get("error"):
            results["errors"].append(f"Slack: {slack_result['error']}")
        
        # Send SMS notification
        sms_result = await self._send_sms(notification_type, notification)
        results["sms_sent"] = sms_result.get("success", False)
        if sms_result.get("error"):
            results["errors"].append(f"SMS: {sms_result['error']}")
        
        # Log the notification attempt
        any_sent = results["slack_sent"] or results["sms_sent"]
        if any_sent:
            logger.info(f"Staff notification sent: {notification_type} - {message[:50]}...")
        else:
            logger.warning(f"Staff notification failed: {results['errors']}")
        
        return results
    
    def _build_notification(
        self,
        notification_type: str,
        message: str,
        session_id: str,
        vehicle_stock: Optional[str] = None,
        customer_name: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Build notification payload"""
        
        # Emoji based on type
        emoji_map = {
            "sales": "🚗",
            "appraisal": "🔄",
            "finance": "💰"
        }
        emoji = emoji_map.get(notification_type, "📢")
        
        # Title
        titles = {
            "sales": "Sales Assistance Requested",
            "appraisal": "Trade-In Appraisal Requested",
            "finance": "Finance Help Requested"
        }
        title = titles.get(notification_type, "Customer Assistance Needed")
        
        # Dashboard link
        dashboard_url = f"https://quirk-frontend-production.up.railway.app/#salesDashboard?session={session_id}"
        
        return {
            "emoji": emoji,
            "title": title,
            "notification_type": notification_type,
            "message": message,
            "session_id": session_id,
            "vehicle_stock": vehicle_stock,
            "customer_name": customer_name or "Guest Customer",
            "dashboard_url": dashboard_url,
            "additional_context": additional_context or {},
            "timestamp": datetime.now().strftime("%I:%M %p")
        }
    
    async def _send_slack(self, notification_type: str, notification: Dict[str, Any]) -> Dict[str, Any]:
        """Send Slack webhook notification"""
        
        webhook_url = self.settings.get_slack_webhook(notification_type)
        
        if not webhook_url:
            return {"success": False, "error": "No Slack webhook configured"}
        
        # Build Slack message with blocks for rich formatting
        slack_payload = {
            "text": f"{notification['emoji']} {notification['title']}: {notification['message']}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{notification['emoji']} {notification['title']}",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*{notification['message']}*"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Customer:*\n{notification['customer_name']}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Time:*\n{notification['timestamp']}"
                        }
                    ]
                }
            ]
        }
        
        # Add vehicle info if present
        if notification.get("vehicle_stock"):
            slack_payload["blocks"].append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Vehicle:* Stock #{notification['vehicle_stock']}"
                }
            })
        
        # Add additional context if present
        context = notification.get("additional_context", {})
        if context.get("budget"):
            slack_payload["blocks"].append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Budget:* ${context['budget']:,.0f}"
                }
            })
        
        if context.get("trade_in"):
            slack_payload["blocks"].append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Trade-In:* {context['trade_in']}"
                }
            })
        
        # Add dashboard link button
        slack_payload["blocks"].append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "📊 View in Dashboard",
                        "emoji": True
                    },
                    "url": notification["dashboard_url"],
                    "style": "primary"
                }
            ]
        })
        
        # Add divider and session ID footer
        slack_payload["blocks"].extend([
            {"type": "divider"},
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Session: `{notification['session_id'][:12]}...` | Quirk AI Kiosk"
                    }
                ]
            }
        ])
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook_url, json=slack_payload)
                
                if response.status_code == 200:
                    return {"success": True}
                else:
                    return {
                        "success": False, 
                        "error": f"Slack returned {response.status_code}: {response.text[:100]}"
                    }
        except httpx.TimeoutException:
            return {"success": False, "error": "Slack webhook timeout"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _send_sms(self, notification_type: str, notification: Dict[str, Any]) -> Dict[str, Any]:
        """Send SMS notification via Twilio"""
        
        if not self.settings.is_sms_configured:
            return {"success": False, "error": "SMS not configured"}
        
        phone_numbers = self.settings.get_sms_numbers(notification_type)
        
        if not phone_numbers:
            return {"success": False, "error": f"No phone numbers for {notification_type}"}
        
        client = self.twilio_client
        if not client:
            return {"success": False, "error": "Twilio client not available"}
        
        # Build SMS message (keep it concise)
        sms_parts = [
            f"{notification['emoji']} QUIRK KIOSK: {notification['title']}",
            f"",
            notification['message']
        ]
        
        if notification.get("vehicle_stock"):
            sms_parts.append(f"Vehicle: Stock #{notification['vehicle_stock']}")
        
        sms_parts.append(f"Customer: {notification['customer_name']}")
        sms_parts.append(f"Time: {notification['timestamp']}")
        
        sms_body = "\n".join(sms_parts)
        
        # Send to all configured numbers
        sent_count = 0
        errors = []
        
        for phone in phone_numbers:
            try:
                client.messages.create(
                    body=sms_body,
                    from_=self.settings.twilio_phone_number,
                    to=phone
                )
                sent_count += 1
            except Exception as e:
                errors.append(f"{phone}: {str(e)}")
        
        if sent_count > 0:
            return {"success": True, "sent_to": sent_count}
        else:
            return {"success": False, "error": "; ".join(errors)}


# Singleton instance
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Get or create notification service instance"""
    global _notification_service
    
    if _notification_service is None:
        from app.core.settings import get_settings
        _notification_service = NotificationService(get_settings())
    
    return _notification_service
