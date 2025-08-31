# 🌟 Kids Daily Task Planner

A modern, colorful, and engaging task planner designed specifically for children aged 6-10. Help kids organize their day with automatic scheduling, priority management, and fun visual elements!

## ✨ Features

### 🎯 Core Functionality
- **Task Input**: Easy-to-use form for adding tasks with priority levels
- **Automatic Scheduling**: Tasks are automatically scheduled with 30-minute slots starting at 9:00 AM
- **Smart Prioritization**: Tasks are sorted by priority (High → Medium → Low)
- **Break Time Insertion**: Automatic 15-minute breaks between tasks
- **Drag & Drop**: Reorder tasks easily with touch and mouse support
- **Task Editing**: Modify task priorities with a simple dialog

### 🎨 Kid-Friendly Design
- **Automatic Emojis**: Tasks get relevant emojis based on content:
  - 📚 Study, homework, reading
  - 🧹 Cleaning, tidying
  - 🔢 Math, numbers
  - 🎨 Art, drawing, painting
  - 🎮 Playing, games
  - 🐶 Walking, pets
  - ⭐ Default for other activities

- **Vibrant Colors**: Priority-based color coding:
  - 🔴 High Priority: Warm yellow gradient
  - 🟡 Medium Priority: Cool teal gradient
  - 🟢 Low Priority: Fresh green gradient
  - 🌸 Break Time: Fun pink gradient

- **Beautiful Interface**:
  - Gradient sky-blue background
  - Rounded cards with soft shadows
  - Smooth animations and transitions
  - Kid-friendly Poppins font
  - Large, touch-friendly buttons

### 📱 Responsive Design
- **Mobile Optimized**: Perfect for phones and tablets
- **Touch Support**: Full drag-and-drop functionality on touch devices
- **Desktop Enhanced**: Beautiful layout for larger screens
- **Cross-Browser**: Works on Chrome, Safari, Firefox, and Edge

## 🚀 Technology Stack

- **Frontend**: React 19.1.1 with TypeScript
- **Styling**: Tailwind CSS 3.4.0 with inline style fallbacks
- **Drag & Drop**: @dnd-kit for smooth interactions
- **Icons**: Lucide React for modern iconography
- **Build Tool**: Create React App with Craco
- **Deployment**: Azure Static Web Apps
- **CI/CD**: GitHub Actions

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/vchiang999/TaskPlanner.git
cd TaskPlanner/frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Build for Production
```bash
npm run build
```

### Testing
```bash
npm test
```

## 🌐 Deployment

The application is automatically deployed to Azure Static Web Apps via GitHub Actions when changes are pushed to the main branch.

**Live Demo**: [Your Azure Static Web App URL]

## 📁 Project Structure

```
TaskPlanner/
├── .github/workflows/     # GitHub Actions CI/CD
├── .vc/                  # Build summaries and documentation
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # Main application component
│   │   ├── SortableTaskItem.tsx  # Individual task component
│   │   ├── index.css     # Global styles and Tailwind imports
│   │   └── index.tsx     # Application entry point
│   ├── public/           # Static assets
│   ├── package.json      # Dependencies and scripts
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── craco.config.js   # Create React App configuration
└── README.md
```

## 🎯 Usage

1. **Add a Task**: Enter what you need to do and select priority level
2. **Watch the Magic**: Tasks automatically get emojis and are scheduled
3. **Reorder Tasks**: Drag and drop to change the order
4. **Edit Priorities**: Click the pencil icon to change task importance
5. **Enjoy Breaks**: Automatic break times keep kids refreshed!

## 🐛 Bug Fixes & Improvements

### Recent Updates (Latest)
- ✅ Fixed all Tailwind CSS styling issues
- ✅ Implemented dual styling approach (Tailwind + inline styles)
- ✅ Resolved drag-and-drop issues on mobile devices
- ✅ Fixed edit dialog functionality
- ✅ Improved break time management
- ✅ Enhanced cross-browser compatibility
- ✅ Added comprehensive animations and transitions

### Known Issues
- None currently! 🎉

## 🔮 Future Features

- **User Accounts**: Personal task management
- **Templates**: Save and reuse daily schedules
- **Parent Dashboard**: Assign tasks and track progress
- **Reward System**: Points and achievements
- **Gift Redemption**: Motivational rewards system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for kids and families
- Designed to make daily planning fun and engaging
- Inspired by the need for better time management tools for children

---

**Made with 🌟 by the TaskPlanner Team**