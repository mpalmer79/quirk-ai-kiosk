export { default } from './SalesManagerDashboard';
export * from './types';
```

---

## Summary

**Created folder structure:**
```
SalesManagerDashboard/
├── index.tsx                    # Export
├── SalesManagerDashboard.tsx    # Main (~180 lines)
├── types.ts                     # Types (~150 lines)
├── constants.ts                 # Constants (~30 lines)
├── styles.ts                    # Styles (~400 lines)
├── utils.ts                     # Helpers (~100 lines)
├── hooks/
│   ├── index.ts
│   ├── useSessions.ts           # Session management
│   ├── useWorksheets.ts         # Worksheet management
│   └── useChatAnalysis.ts       # Chat analysis
└── components/
    ├── index.ts
    ├── SessionList.tsx
    ├── SessionCard.tsx
    ├── WorksheetList.tsx
    ├── WorksheetCard.tsx
    ├── WorksheetDetail.tsx
    ├── ChatTranscript.tsx
    └── Placeholder.tsx
