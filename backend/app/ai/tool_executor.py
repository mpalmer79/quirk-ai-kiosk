"""
Quirk AI Kiosk - Tool Executor
Executes AI tools and returns results.
"""

import re
import logging
from typing import Dict, Any, List, Tuple

from app.services.conversation_state import ConversationState, ConversationStateManager
from app.services.vehicle_retriever import SemanticVehicleRetriever, ScoredVehicle
from app.services.notifications import get_notification_service
from app.ai.helpers import (
    format_vehicles_for_tool_result,
    format_vehicle_details_for_tool,
    format_worksheet_for_tool_result,
)

logger = logging.getLogger("quirk_ai.tool_executor")


async def execute_tool(
    tool_name: str,
    tool_input: Dict[str, Any],
    state: ConversationState,
    retriever: SemanticVehicleRetriever,
    state_manager: ConversationStateManager
) -> Tuple[str, List[ScoredVehicle], bool]:
    """
    Execute a tool and return the result.
    
    Args:
        tool_name: Name of the tool to execute
        tool_input: Input parameters for the tool
        state: Current conversation state
        retriever: Vehicle retriever service
        state_manager: Conversation state manager
        
    Returns:
        Tuple of (result_text, vehicles_to_show, staff_notified)
    """
    vehicles_to_show = []
    staff_notified = False
    result = ""
    
    if tool_name == "calculate_budget":
        result, vehicles_to_show, staff_notified = await _execute_calculate_budget(
            tool_input, state
        )
    
    elif tool_name == "check_vehicle_affordability":
        result, vehicles_to_show, staff_notified = await _execute_check_affordability(
            tool_input, state, retriever
        )
    
    elif tool_name == "search_inventory":
        result, vehicles_to_show, staff_notified = await _execute_search_inventory(
            tool_input, state, retriever
        )
    
    elif tool_name == "get_vehicle_details":
        result, vehicles_to_show, staff_notified = await _execute_get_vehicle_details(
            tool_input, retriever
        )
    
    elif tool_name == "find_similar_vehicles":
        result, vehicles_to_show, staff_notified = await _execute_find_similar(
            tool_input, retriever
        )
    
    elif tool_name == "notify_staff":
        result, vehicles_to_show, staff_notified = await _execute_notify_staff(
            tool_input, state
        )
    
    elif tool_name == "mark_favorite":
        result, vehicles_to_show, staff_notified = await _execute_mark_favorite(
            tool_input, state, state_manager
        )
    
    elif tool_name == "lookup_conversation":
        result, vehicles_to_show, staff_notified = await _execute_lookup_conversation(
            tool_input, state, state_manager
        )
    
    elif tool_name == "save_customer_phone":
        result, vehicles_to_show, staff_notified = await _execute_save_phone(
            tool_input, state, state_manager
        )
    
    elif tool_name == "create_worksheet":
        result, vehicles_to_show, staff_notified = await _execute_create_worksheet(
            tool_input, state, retriever
        )
    
    else:
        result = f"Unknown tool: {tool_name}"
    
    return result, vehicles_to_show, staff_notified


# =============================================================================
# TOOL IMPLEMENTATIONS
# =============================================================================

async def _execute_calculate_budget(
    tool_input: Dict[str, Any],
    state: ConversationState
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute calculate_budget tool"""
    down_payment = tool_input.get("down_payment", 0)
    monthly_payment = tool_input.get("monthly_payment", 0)
    apr = tool_input.get("apr", 7.0)
    term_months = tool_input.get("term_months", 84)
    
    # Calculate present value of loan (what they can finance)
    monthly_rate = apr / 100 / 12
    
    if monthly_rate > 0:
        # PV = PMT × [(1 - (1 + r)^-n) / r]
        pv_factor = (1 - (1 + monthly_rate) ** -term_months) / monthly_rate
        financed_amount = monthly_payment * pv_factor
    else:
        financed_amount = monthly_payment * term_months
    
    max_vehicle_price = down_payment + financed_amount
    total_of_payments = monthly_payment * term_months
    total_interest = total_of_payments - financed_amount
    
    # Update state with budget info
    state.budget_max = max_vehicle_price
    state.down_payment = down_payment
    state.monthly_payment_target = monthly_payment
    
    result = f"""BUDGET CALCULATION RESULT:
- Down Payment: ${down_payment:,.0f}
- Monthly Payment: ${monthly_payment:,.0f}
- APR: {apr}%
- Term: {term_months} months
- Amount Financed: ${financed_amount:,.0f}
- MAX VEHICLE PRICE: ${max_vehicle_price:,.0f}
- Total Interest: ${total_interest:,.0f}

IMPORTANT: Use max_price of {int(max_vehicle_price)} when searching inventory.
DISCLOSE: Taxes and fees are separate. NH doesn't tax payments; other states may add tax."""
    
    return (result, [], False)


async def _execute_check_affordability(
    tool_input: Dict[str, Any],
    state: ConversationState,
    retriever: SemanticVehicleRetriever
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute check_vehicle_affordability tool"""
    vehicles_to_show = []
    
    # Get budget parameters
    down_payment = tool_input.get("down_payment", 0)
    monthly_payment = tool_input.get("monthly_payment", 0)
    apr = tool_input.get("apr", 7.0)
    term_months = tool_input.get("term_months", 84)
    
    # Calculate max affordable price
    monthly_rate = apr / 100 / 12
    if monthly_rate > 0:
        pv_factor = (1 - (1 + monthly_rate) ** -term_months) / monthly_rate
        financed_amount = monthly_payment * pv_factor
    else:
        financed_amount = monthly_payment * term_months
        pv_factor = term_months
    
    max_affordable = down_payment + financed_amount
    
    # Get vehicle price - either from stock number or direct input
    vehicle_price = tool_input.get("vehicle_price", 0)
    stock_number = tool_input.get("stock_number")
    vehicle_desc = tool_input.get("vehicle_description", "this vehicle")
    
    if stock_number and not vehicle_price:
        vehicle = retriever.get_vehicle_by_stock(stock_number)
        if vehicle:
            vehicle_price = vehicle.get('MSRP') or vehicle.get('msrp') or vehicle.get('price', 0)
            year = vehicle.get('Year') or vehicle.get('year', '')
            model = vehicle.get('Model') or vehicle.get('model', '')
            trim = vehicle.get('Trim') or vehicle.get('trim', '')
            color = vehicle.get('exteriorColor') or vehicle.get('Exterior Color', '')
            vehicle_desc = f"{year} {model} {trim} ({color})".strip()
            
            # Add vehicle to show list
            vehicles_to_show = [ScoredVehicle(
                vehicle=vehicle,
                score=100,
                match_reasons=["Affordability check requested"],
                preference_matches={}
            )]
        else:
            logger.warning(f"Vehicle not found for affordability check: {stock_number}")
    
    # Calculate the difference
    difference = max_affordable - vehicle_price
    can_afford = difference >= 0
    
    # Update state with budget info
    state.budget_max = max_affordable
    state.down_payment = down_payment
    state.monthly_payment_target = monthly_payment
    
    # Calculate actual monthly payment for this vehicle
    actual_finance_amount = vehicle_price - down_payment
    if monthly_rate > 0 and pv_factor > 0:
        actual_monthly = actual_finance_amount / pv_factor
    else:
        actual_monthly = actual_finance_amount / term_months
    
    if can_afford:
        result = f"""AFFORDABILITY CHECK: ✅ YES - WITHIN BUDGET!

Vehicle: {vehicle_desc}
Stock #: {stock_number or 'N/A'}
Vehicle Price: ${vehicle_price:,.0f}

Customer's Budget:
- Down Payment: ${down_payment:,.0f}
- Target Monthly Payment: ${monthly_payment:,.0f}/month
- Max Affordable Price: ${max_affordable:,.0f}

RESULT: ✅ Customer CAN afford this vehicle!
- Budget headroom: ${difference:,.0f} under their max
- Actual monthly payment would be: ~${actual_monthly:,.0f}/month (under their ${monthly_payment:,.0f} target)

RESPONSE GUIDANCE: Confirm they can afford it, mention the actual payment is even lower than their target, and offer to proceed with next steps (test drive, financing details, etc.)

DISCLOSE: Taxes and fees are separate. NH doesn't tax payments; other states may add tax."""
    else:
        # Calculate what would be needed to afford this vehicle
        needed_down = vehicle_price - financed_amount
        needed_monthly = actual_finance_amount / pv_factor if pv_factor > 0 else actual_finance_amount / term_months
        
        result = f"""AFFORDABILITY CHECK: ❌ OVER BUDGET

Vehicle: {vehicle_desc}
Stock #: {stock_number or 'N/A'}
Vehicle Price: ${vehicle_price:,.0f}

Customer's Budget:
- Down Payment: ${down_payment:,.0f}
- Target Monthly Payment: ${monthly_payment:,.0f}/month
- Max Affordable Price: ${max_affordable:,.0f}

RESULT: ❌ This vehicle is ${abs(difference):,.0f} OVER their budget.
- To afford this vehicle, they would need EITHER:
  • Increase down payment to ~${needed_down:,.0f} (add ${needed_down - down_payment:,.0f})
  • Increase monthly payment to ~${needed_monthly:,.0f}/month

RESPONSE GUIDANCE:
1. Be honest but empathetic - don't make them feel bad
2. Explain the gap clearly (${abs(difference):,.0f} over budget)
3. Offer OPTIONS:
   - Can they stretch the down payment or monthly?
   - Show similar vehicles WITHIN their ${max_affordable:,.0f} budget
4. Use search_inventory(max_price={int(max_affordable)}) to find alternatives

DO NOT just show random vehicles without addressing their question about THIS specific vehicle first."""
    
    return (result, vehicles_to_show, False)


async def _execute_search_inventory(
    tool_input: Dict[str, Any],
    state: ConversationState,
    retriever: SemanticVehicleRetriever
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute search_inventory tool"""
    query = tool_input.get("query", "")
    
    # Use semantic retrieval
    scored_vehicles = retriever.retrieve(
        query=query,
        conversation_state=state,
        limit=12
    )
    
    if tool_input.get("body_style"):
        scored_vehicles = [
            sv for sv in scored_vehicles 
            if (sv.vehicle.get('bodyStyle') or '').lower() == tool_input['body_style'].lower()
        ]
    
    # Apply max_price filter from tool input OR from calculated budget OR from query
    max_price = tool_input.get("max_price")
    if not max_price and state.budget_max:
        max_price = state.budget_max
        logger.info(f"Using calculated budget max: ${max_price:,.0f}")
    
    # FALLBACK: Extract budget from query if not explicitly provided
    if not max_price:
        budget_patterns = [
            r'under\s*\$?([\d,]+)\s*k\b',
            r'under\s*\$?([\d,]+)\b',
            r'below\s*\$?([\d,]+)\s*k\b',
            r'below\s*\$?([\d,]+)\b',
            r'less\s*than\s*\$?([\d,]+)\s*k\b',
            r'less\s*than\s*\$?([\d,]+)\b',
            r'max\s*\$?([\d,]+)\s*k\b',
            r'max\s*\$?([\d,]+)\b',
            r'\$?([\d,]+)\s*k?\s*budget',
        ]
        for pattern in budget_patterns:
            match = re.search(pattern, query.lower())
            if match:
                amount_str = match.group(1).replace(',', '')
                amount = float(amount_str)
                if 'k' in pattern or amount < 1000:
                    amount *= 1000
                max_price = int(amount)
                logger.info(f"Extracted budget from query: ${max_price:,.0f}")
                break
    
    if max_price:
        original_count = len(scored_vehicles)
        scored_vehicles = [
            sv for sv in scored_vehicles
            if (sv.vehicle.get('MSRP') or sv.vehicle.get('price', 0)) <= max_price
        ]
        logger.info(f"Budget filter ${max_price:,}: {original_count} -> {len(scored_vehicles)} vehicles")
    
    # Limit to top 6 after filtering
    scored_vehicles = scored_vehicles[:6]
    
    # CRITICAL: Filter out vehicles matching trade-in model
    if state.trade_model:
        trade_model_lower = state.trade_model.lower()
        scored_vehicles = [
            sv for sv in scored_vehicles
            if trade_model_lower not in (sv.vehicle.get('Model') or sv.vehicle.get('model', '')).lower()
        ]
        if scored_vehicles:
            logger.info(f"Filtered out {state.trade_model} vehicles (trade-in model)")
    
    result = format_vehicles_for_tool_result(scored_vehicles)
    
    return (result, scored_vehicles, False)


async def _execute_get_vehicle_details(
    tool_input: Dict[str, Any],
    retriever: SemanticVehicleRetriever
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute get_vehicle_details tool"""
    vehicles_to_show = []
    stock = tool_input.get("stock_number", "")
    vehicle = retriever.get_vehicle_by_stock(stock)
    
    if vehicle:
        vehicles_to_show = [ScoredVehicle(
            vehicle=vehicle, 
            score=100, 
            match_reasons=["Requested by customer"],
            preference_matches={}
        )]
    
    result = format_vehicle_details_for_tool(vehicle)
    
    return (result, vehicles_to_show, False)


async def _execute_find_similar(
    tool_input: Dict[str, Any],
    retriever: SemanticVehicleRetriever
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute find_similar_vehicles tool"""
    vehicles_to_show = []
    stock = tool_input.get("stock_number", "")
    source_vehicle = retriever.get_vehicle_by_stock(stock)
    
    if source_vehicle:
        similar = retriever.retrieve_similar(source_vehicle, limit=4)
        vehicles_to_show = similar
        result = f"Similar vehicles to Stock #{stock}:\n" + format_vehicles_for_tool_result(similar)
    else:
        result = f"Could not find vehicle {stock} to compare."
    
    return (result, vehicles_to_show, False)


async def _execute_notify_staff(
    tool_input: Dict[str, Any],
    state: ConversationState
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute notify_staff tool"""
    notification_type = tool_input.get("notification_type", "sales")
    message = tool_input.get("message", "Customer needs assistance")
    vehicle_stock = tool_input.get("vehicle_stock")
    
    # Update state
    state.staff_notified = True
    state.staff_notification_type = notification_type
    
    if notification_type == "appraisal":
        state.appraisal_requested = True
    elif notification_type == "sales":
        state.test_drive_requested = True
    
    # Build additional context for notification
    additional_context = {}
    if state.budget_max:
        additional_context["budget"] = state.budget_max
    if state.trade_model:
        additional_context["trade_in"] = f"{state.trade_year or ''} {state.trade_make or ''} {state.trade_model}".strip()
    if state.vehicle_preferences:
        additional_context["preferences"] = state.vehicle_preferences
    
    # Send real notifications (Slack + SMS)
    try:
        notification_service = get_notification_service()
        notification_result = await notification_service.notify_staff(
            notification_type=notification_type,
            message=message,
            session_id=state.session_id,
            vehicle_stock=vehicle_stock,
            customer_name=state.customer_name,
            additional_context=additional_context
        )
        
        # Log notification status
        if notification_result.get("slack_sent") or notification_result.get("sms_sent"):
            channels = []
            if notification_result.get("slack_sent"):
                channels.append("Slack")
            if notification_result.get("sms_sent"):
                channels.append("SMS")
            logger.info(f"Staff notified via: {', '.join(channels)}")
        else:
            logger.warning(f"Notification sent to dashboard only: {notification_result.get('errors', [])}")
    except Exception as e:
        logger.error(f"Notification service error: {e}")
    
    result = f"✓ {notification_type.title()} team has been notified: {message}"
    if vehicle_stock:
        result += f" (regarding Stock #{vehicle_stock})"
    result += " A team member will be with you shortly!"
    
    return (result, [], True)


async def _execute_mark_favorite(
    tool_input: Dict[str, Any],
    state: ConversationState,
    state_manager: ConversationStateManager
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute mark_favorite tool"""
    stock = tool_input.get("stock_number", "")
    state_manager.mark_vehicle_favorite(state.session_id, stock)
    result = f"✓ Stock #{stock} marked as a favorite. I'll remember this is one you like!"
    
    return (result, [], False)


async def _execute_lookup_conversation(
    tool_input: Dict[str, Any],
    state: ConversationState,
    state_manager: ConversationStateManager
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute lookup_conversation tool"""
    phone = tool_input.get("phone_number", "")
    phone_digits = ''.join(c for c in phone if c.isdigit())
    
    if len(phone_digits) != 10:
        result = "I need a valid 10-digit phone number to look up your previous conversation. Please provide your phone number with area code."
    else:
        previous_state = state_manager.get_state_by_phone(phone_digits)
        
        if previous_state:
            # Found previous conversation - generate summary
            summary_parts = ["✓ Found your previous conversation! Here's what I remember:"]
            
            if previous_state.customer_name:
                summary_parts.append(f"\nName: {previous_state.customer_name}")
            
            if previous_state.budget_max:
                summary_parts.append(f"\nBudget: Up to ${previous_state.budget_max:,.0f}")
            
            if previous_state.preferred_types:
                summary_parts.append(f"\nLooking for: {', '.join(previous_state.preferred_types)}")
            
            if previous_state.use_cases:
                summary_parts.append(f"\nPrimary use: {', '.join(previous_state.use_cases)}")
            
            if previous_state.favorite_vehicles:
                summary_parts.append(f"\nFavorite vehicles: {', '.join(previous_state.favorite_vehicles)}")
            
            if previous_state.has_trade_in:
                trade_info = f"\nTrade-in: {previous_state.trade_year or ''} {previous_state.trade_make or ''} {previous_state.trade_model or ''}"
                if previous_state.trade_monthly_payment:
                    trade_info += f" (${previous_state.trade_monthly_payment:,.0f}/mo)"
                summary_parts.append(trade_info)
            
            if previous_state.discussed_vehicles:
                models = [v.model for v in previous_state.discussed_vehicles.values()][:5]
                summary_parts.append(f"\nVehicles we discussed: {', '.join(models)}")
            
            summary_parts.append(f"\n\nYour conversation had {previous_state.message_count} messages. How would you like to continue?")
            
            result = ''.join(summary_parts)
            
            # Merge previous state into current session
            state.budget_max = previous_state.budget_max or state.budget_max
            state.budget_min = previous_state.budget_min or state.budget_min
            state.monthly_payment_target = previous_state.monthly_payment_target or state.monthly_payment_target
            state.preferred_types = previous_state.preferred_types or state.preferred_types
            state.preferred_features = previous_state.preferred_features or state.preferred_features
            state.use_cases = previous_state.use_cases or state.use_cases
            state.has_trade_in = previous_state.has_trade_in or state.has_trade_in
            state.trade_year = previous_state.trade_year or state.trade_year
            state.trade_make = previous_state.trade_make or state.trade_make
            state.trade_model = previous_state.trade_model or state.trade_model
            state.trade_monthly_payment = previous_state.trade_monthly_payment or state.trade_monthly_payment
            state.trade_payoff = previous_state.trade_payoff or state.trade_payoff
            state.favorite_vehicles = previous_state.favorite_vehicles or state.favorite_vehicles
            state.customer_phone = phone_digits
            state.customer_name = previous_state.customer_name or state.customer_name
            
            logger.info(f"Merged previous conversation into session {state.session_id}")
        else:
            result = f"I couldn't find a previous conversation with phone number ending in {phone_digits[-4:]}. This might be your first visit, or you may have used a different number. Would you like to start fresh?"
    
    return (result, [], False)


async def _execute_save_phone(
    tool_input: Dict[str, Any],
    state: ConversationState,
    state_manager: ConversationStateManager
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute save_customer_phone tool"""
    phone = tool_input.get("phone_number", "")
    phone_digits = ''.join(c for c in phone if c.isdigit())
    
    if len(phone_digits) != 10:
        result = "I need a valid 10-digit phone number. Please provide your full phone number with area code."
    else:
        state_manager.set_customer_phone(state.session_id, phone_digits)
        state_manager.persist_session(state.session_id)
        result = f"✓ I've saved your phone number ending in {phone_digits[-4:]}. Next time you visit, just tap 'Continue our conversation' and enter this number to pick up where we left off!"
    
    return (result, [], False)


async def _execute_create_worksheet(
    tool_input: Dict[str, Any],
    state: ConversationState,
    retriever: SemanticVehicleRetriever
) -> Tuple[str, List[ScoredVehicle], bool]:
    """Execute create_worksheet tool"""
    vehicles_to_show = []
    
    stock_number = tool_input.get("stock_number")
    if not stock_number:
        return ("ERROR: stock_number is required to create a worksheet.", [], False)
    
    # Verify vehicle exists
    vehicle = retriever.get_vehicle_by_stock(stock_number)
    if not vehicle:
        return (f"ERROR: Vehicle {stock_number} not found in inventory.", [], False)
    
    # Add to vehicles to show
    vehicles_to_show = [ScoredVehicle(
        vehicle=vehicle,
        score=100,
        match_reasons=["Digital Worksheet created"],
        preference_matches={}
    )]
    
    try:
        # Import worksheet service
        from app.services.worksheet_service import get_worksheet_service
        from app.models.worksheet import WorksheetCreateRequest
        
        # Build request
        request = WorksheetCreateRequest(
            session_id=state.session_id,
            stock_number=stock_number,
            down_payment=tool_input.get("down_payment") or state.down_payment or 0,
            monthly_payment_target=tool_input.get("monthly_payment_target") or state.monthly_payment_target,
            include_trade=tool_input.get("include_trade", False) or state.has_trade_in,
            customer_name=state.customer_name,
            customer_phone=state.customer_phone,
        )
        
        # Create worksheet
        service = get_worksheet_service()
        worksheet = await service.create_worksheet(request, state)
        
        # Format result
        result = format_worksheet_for_tool_result(worksheet)
        
        logger.info(
            f"Created worksheet {worksheet.id} for {stock_number} - "
            f"${worksheet.selling_price:,.0f}, ${worksheet.down_payment:,.0f} down"
        )
        
    except ImportError as e:
        logger.error(f"Worksheet service not available: {e}")
        result = """ERROR: Digital Worksheet feature is not yet available.

FALLBACK: Provide payment estimates manually:
- Use calculate_budget tool to show what they can afford
- Offer to get a sales manager to run exact numbers
- Use notify_staff(notification_type="finance") if they want detailed quotes"""
    
    except Exception as e:
        logger.error(f"Failed to create worksheet: {e}")
        result = f"""ERROR: Failed to create worksheet: {str(e)}

FALLBACK: Let customer know there was a technical issue and offer to get a sales manager to help with the numbers."""
    
    return (result, vehicles_to_show, False)
