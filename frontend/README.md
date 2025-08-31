# Task Planner Frontend Application

This project is a React-based frontend application for a kids' task planner, designed to be engaging and easy to use. It features automatic task prioritization, scheduling with break times, and a visually appealing interface.

## Features Implemented:

-   **Interactive Task Management:** Add tasks with priority, edit task priority, and reorder tasks using drag-and-drop.
-   **Automatic Scheduling:** Tasks are automatically assigned time slots, including integrated break times.
-   **Visual Redesign:** A complete UI redesign has been implemented using Tailwind CSS, featuring a "Sunny Day" theme, vibrant colours, and a kid-friendly typography (Poppins font).
-   **Automatic Emoji Assignment:** Emojis are automatically assigned to tasks based on their content, enhancing visual appeal without requiring manual input.
-   **Modern Icons:** Integration of `lucide-react` icons for a clean and consistent look.
-   **Animations:** Smooth fade-in and slide-down animations for task cards to improve user experience.

## Technical Stack:

-   **Frontend:** React.js, Tailwind CSS, `dnd-kit`, `lucide-react`.
-   **Build Tool:** Create React App (CRA) with `craco` for custom configuration.
-   **Deployment:** Automated CI/CD pipeline using GitHub Actions to Azure Static Web Apps.

## Getting Started (Local Development):

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm start
    ```
    The application should open in your browser at `http://localhost:3000`.

## Known Issues:

-   **Tailwind CSS styles are not applying in local development (`npm start`):** Despite extensive configuration and troubleshooting with `craco` and PostCSS, the Tailwind CSS styles are currently not rendering when running the application locally. This results in a basic, unstyled UI during local development. The deployed version via Azure Static Web Apps *should* reflect the intended design, but this local issue needs to be resolved for effective development.

## Deployment:

This application is set up for continuous deployment. Any pushes to the `main` branch in the connected GitHub repository will automatically trigger a build and deployment to Azure Static Web Apps via GitHub Actions.