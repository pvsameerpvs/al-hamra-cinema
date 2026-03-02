# Al Hamra Cinema Booking System

A complete Film Booking System built with Next.js 14, TypeScript, Tailwind CSS, shadcn/ui components, and Google Sheets as the database.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 App Router
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: Google Sheets API
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 🚀 Setup Instructions

### 1. Clone & Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Google Sheets API Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for "Google Sheets API" and enable it.
4. Go to **APIs & Services > Credentials**.
5. Click **Create Credentials > Service Account**.
6. Provide a Service Account name and ID.
7. Click the newly created Service Account, go to the **Keys** tab, and generate a new **JSON key**.
8. Save this file, as you'll need its contents for environment variables.

### 3. Create the Database (Google Sheet)
1. Create a new Google Sheet.
2. Share the Google Sheet with the **Service Account Email** you created (giving it `Editor` access).
3. The Spreadsheet ID is in the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
4. Create the following 3 sheets EXACTLY as named (case-sensitive):
   - `seats` (Make sure A1=seat_id, B1=section, C1=row, D1=seat_number, E1=status, F1=price)
   - `bookings` (Make sure A1=booking_id, B1=seat_id, C1=customer_name, D1=phone, E1=amount, F1=payment_status, G1=created_at)
   - `revenue_logs` (Make sure A1=booking_id, B1=amount, C1=month, D1=date)

### 4. Setup Environment Variables
Create a `.env.local` file at the root of the project by copying from the example:
\`\`\`bash
cp .env.example .env.local
\`\`\`
Fill in the credentials from your downloaded JSON file.

### 5. Initialize the Database
Since the seats table is empty, we provided an initialization script!
Start the server:
\`\`\`bash
npm run dev
\`\`\`
Open this URL in your browser ONCE to populate the seats into your Google Sheet:
[http://localhost:3000/api/admin/init-seats](http://localhost:3000/api/admin/init-seats)

**Note:** Only run this once, or you'll get duplicate rows!

### 6. You are Ready!
Open [http://localhost:3000](http://localhost:3000) to view the cinema booking system.
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view your ticketing dashboard.

---

## 🚀 Deploying to Vercel

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your GitHub repository.
4. In the **Environment Variables** section, copy the 3 variables from your `.env.local`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (Important: Be aware of `\\n` formatting if it breaks in Vercel. Often you can just paste the raw text with actual newlines)
   - `GOOGLE_SHEET_ID`
5. Click **Deploy**. Vercel will automatically detect the Next.js framework and compile everything for production.

---

## Folder Structure

\`\`\`
al-hamra-cinema/
├── app/
│   ├── page.tsx               # Main Booking Interface
│   ├── dashboard/page.tsx     # Dashboard Interface
│   └── api/                   # Route Handlers
│       ├── seats/route.ts
│       ├── reserve/route.ts
│       ├── book/route.ts
│       ├── dashboard/route.ts
│       └── admin/init-seats/route.ts # Init route for DB creation
├── lib/
│   ├── google.ts              # Google Sheets Auth setup
│   ├── sheetHelpers.ts        # Reusable queries and sheet modifications
│   └── types.ts               # Shared TypeScript interface definitions
├── components/
│   ├── SeatGrid.tsx           # Interactive cinema map logic
│   ├── BookingDialog.tsx      # Modal component for booking
│   ├── DashboardCards.tsx     # Stat cards for dashboard
│   ├── RevenueChart.tsx       # Recharts bar graph of revenue
│   └── ui/                    # shadcn/ui primitive components
\`\`\`
