# ADMIN OPEN SOURCE PROJECT

## **Introduction**

**Subscribe Open Source** is a modern web application built using the following technologies:

- **React** – A JavaScript library for building interactive user interfaces.
- **Vite** – A fast and lightweight build tool and development server that enhances React performance.
- **Material UI** – A React component library that provides a set of pre-styled and accessible UI components following Material Design principles.
- **Tailwind CSS** – A utility-first CSS framework used for fast and responsive custom styling.
- **Supabase** - Backend

---

## **Installment**

Before you begin, ensure you have the following software installed on your system:

- **Node.js 22.14.0** (Please include an option to install npm during the installation process if it is not already selected)
- **Git**
- **Code Editor** such as Visual Studio Code

---

## **Initialization**

1. Clone the repo:

```bash
   git clone https://github.com/your-username/your-project-name.git
```

2.Navigate into the project directory:

```bash
    cd your-project-name
```

3. Install the required dependencies listed in the package.json file:

```bash
   npm install
```

4.Start the project locally:

```bash
    npm run dev
```

## **Env Variables**

Some variables require enhanced security and should be stored in a .env file.

Please ensure the following environment variables are defined in your .env file for the application to work correctly:

```bash
    VITE_SUPABASE_URL=your-supabase-url
    VITE_SUPABASE_KEY=your-supabase-key
```

## Supabase Calls

To streamline token management and error handling, we created a centralized `apiInstance` for all Supabase interactions. The Supabase URL and API key are managed securely via environment variables.

## Styling

For styling, we use **Tailwind CSS V4** (without `tailwind.config.js`) along with **Material UI (MUI)** to manage the theme colors consistently across the application.

## Queries

Some database operations and constraints are implemented using **RPC** (remote procedure calls). This approach is necessary because Supabase does not support client-side transaction rollbacks. To address this, we’ve written SQL scripts in the Supabase SQL Editor to handle rollbacks for most queries. However, **Supabase Storage** currently does not support transactional rollbacks, so we handle any necessary cleanup manually when required.
