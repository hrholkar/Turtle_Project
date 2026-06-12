TurtleTrack — Project Structure
=================================

Turtle_Project/
├── README.md                         Root documentation
├── .env.example                      Environment variables template
├── .gitignore                        Git ignore rules
├── docker-compose.yml                Full-stack Docker orchestration
├── start-dev.ps1                     Windows development startup
├── start-dev.sh                      Unix/Mac development startup
│
├── uploads/                          Local image storage (gitignored)
│   ├── turtles/                      Turtle profile images
│   ├── sightings/                    Sighting images
│   └── temporary/                    Processing buffer
│
├── frontend/                         React Native Expo (iOS + Android)
│   ├── app.json                      Expo configuration
│   ├── package.json                  Dependencies
│   ├── tsconfig.json                 TypeScript configuration
│   ├── babel.config.js               Babel + NativeWind
│   ├── tailwind.config.js            NativeWind design system
│   │
│   ├── app/                          Expo Router file-based navigation
│   │   ├── _layout.tsx               Root layout (React Query provider)
│   │   ├── result.tsx                Identification result screen
│   │   ├── (tabs)/                   Bottom tab screens
│   │   │   ├── _layout.tsx           Tab bar configuration
│   │   │   ├── index.tsx             Home / Dashboard
│   │   │   ├── upload.tsx            Camera / Identify
│   │   │   ├── turtles.tsx           Turtle list
│   │   │   ├── pending.tsx           Admin verification
│   │   │   └── stats.tsx             Conservation statistics
│   │   ├── turtle/
│   │   │   └── [id].tsx              Turtle profile detail
│   │   └── pending/
│   │       └── [id].tsx              Pending verification detail
│   │
│   └── src/
│       ├── constants/
│       │   ├── colors.ts             Design system color tokens
│       │   ├── typography.ts         Type scale and text styles
│       │   └── theme.ts              Spacing, radii, shadows, API URLs
│       ├── types/
│       │   └── index.ts              Shared TypeScript interfaces
│       ├── services/
│       │   ├── api.ts                Axios client
│       │   ├── turtle.service.ts     Turtle CRUD
│       │   └── index.ts              Dashboard, sighting, pending services
│       ├── hooks/
│       │   └── useQueries.ts         React Query hooks
│       └── components/
│           ├── ui/
│           │   ├── Button.tsx        Reusable button variants
│           │   ├── Badges.tsx        ConfidenceBadge, YearsBadge
│           │   └── StatCard.tsx      Dashboard stat display
│           ├── turtle/
│           │   └── TurtleCard.tsx    Turtle list card
│           └── sighting/
│               └── SightingCard.tsx  Sighting list card
│
├── backend-node/                     Node.js REST API
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── src/
│       ├── server.ts                 Express app entry point
│       ├── config/
│       │   ├── env.ts                Environment variables
│       │   └── database.ts           MongoDB connection
│       ├── types/
│       │   └── index.ts              Shared TypeScript types
│       ├── models/
│       │   ├── Turtle.ts             Mongoose Turtle schema
│       │   ├── Sighting.ts           Mongoose Sighting schema
│       │   └── PendingVerification.ts Mongoose Pending schema
│       ├── validators/
│       │   ├── turtle.validator.ts   Zod schemas for turtle
│       │   └── sighting.validator.ts Zod schemas for sightings
│       ├── middleware/
│       │   ├── errorHandler.ts       Global error handling
│       │   └── upload.ts             Multer file upload
│       ├── utils/
│       │   ├── dateHelper.ts         Conservation time utilities
│       │   └── storage.ts            LocalStorage + S3 adapter
│       ├── services/
│       │   ├── ml.service.ts         Python ML service client
│       │   ├── turtle.service.ts     Turtle business logic
│       │   ├── sighting.service.ts   Sighting + identify pipeline
│       │   ├── pending.service.ts    Verification lifecycle
│       │   └── dashboard.service.ts  Aggregation statistics
│       ├── controllers/
│       │   ├── turtle.controller.ts
│       │   ├── sighting.controller.ts
│       │   ├── pending.controller.ts
│       │   └── dashboard.controller.ts
│       └── routes/
│           ├── index.ts              API router
│           ├── turtle.routes.ts
│           ├── sighting.routes.ts
│           ├── pending.routes.ts
│           └── dashboard.routes.ts
│
├── backend-ml/                       Python ML Service
│   ├── main.py                       FastAPI entry point
│   ├── requirements.txt              Python dependencies
│   ├── Dockerfile
│   ├── storage/
│   │   ├── index/                    FAISS index persistence
│   │   └── embeddings/               Reserved
│   └── app/
│       ├── config/
│       │   └── settings.py           Pydantic settings
│       ├── models/
│       │   └── schemas.py            Request/response schemas
│       ├── api/
│       │   └── routes.py             FastAPI routes
│       └── services/
│           ├── preprocessing/
│           │   └── image_processor.py  EXIF, resize, normalize
│           ├── extraction/
│           │   └── feature_extractor.py MobileNetV2 embeddings
│           ├── matching/
│           │   └── faiss_index.py     FAISS index manager
│           └── similarity/
│               └── scorer.py          Threshold classification
│
└── docs/
    ├── INSTALLATION.md
    ├── PROJECT_STRUCTURE.md           (this file)
    ├── API_DOCUMENTATION.txt
    ├── ML_PIPELINE.txt
    └── SETUP_GUIDE.txt
