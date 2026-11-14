To prevent Git merge conflicts and give both developers clear execution steps, the project is divided into strictly isolated domains. You will build the overarching platform shell, and your friend will build the standalone HTML5 Canvas games that load inside your shell.

### **Phase 1: Branching Protocol**

Before writing any code, both developers must isolate their work from the main branch to ensure you do not overwrite each other's files.

| Developer | Goal | Terminal Command |
| :---- | :---- | :---- |
| **You** | Create the UI workspace | git checkout \-b feature/platform-ui |
| **Your Friend** | Create the Game workspace | git checkout \-b feature/physics-missions |

### **Phase 2: Your Task List (Platform Architect & UI)**

**Active Branch:** feature/platform-ui Your objective is to build the static, mocked EdTech shell. You will not write any game physics.

| Sequence | Task | File Target | Technical Implementation for Claude Code |
| :---- | :---- | :---- | :---- |
| **1\. Aesthetics** | Base Styling | styles.css | Define a dark, cinematic space theme using deep blues, starry background placeholders, and neon orange/cyan accents. |
| **2\. Landing Page** | Onboarding | index.html | Build the "Zero-G Academy" header, an "About Us" section, a "Contact Us" footer, and a prominent "Sign Up" button. |
| **3\. Placement Test** | Logic & UI | index.html | Create a modal triggered by the "Sign Up" button. Generate 5 multiple-choice questions based on the NASA Planetary Fact Sheet. Mock logic to output a starting level (1-5). |
| **4\. Platform Shell** | Dashboard Layout | dashboard.html | Build a top navigation bar (Home, Dashboard, Profile). Build a left sidebar for the "Student Profile" showing a mocked Username, Current Level, and Total Time Spent. |
| **5\. Skill Tree** | Lesson Plan UI | dashboard.html | Build the main content area with nodes 1-5 categorized as "About Astronauts" (Easy) and nodes 6-10 as "About Spaceships" (Medium). |
| **6\. Routing Modals** | Mission Launcher | dashboard.html | Make nodes clickable. Clicking a node opens a modal with a placeholder image, short description, and a "Study" button. The Study button will eventually load your friend's mission files into an \<iframe\>. |

### **Phase 3: Your Friend's Task List (Physics & Game Engine)**

**Active Branch:** feature/physics-missions Your friend's objective is to build the actual interactive mini-games. They will not touch the CSS or layout of the main dashboard.

| Sequence | Task | File Target | Technical Implementation for Claude Code |
| :---- | :---- | :---- | :---- |
| **1\. Mission 1** | Gravity Drop | mission1.html, physics.js | Build a 3-column HTML5 Canvas (Earth, Moon, Mars). Implement a dropdown to select mass (10kg Apple, 1000kg Boulder). Program elastic bouncing physics retaining 70% kinetic energy upon floor impact. |
| **2\. Mission 2** | Mars Rover | mission2.html, rover.js | Build a 2D side-scrolling physics canvas. The player drives a real NASA rover (e.g., Perseverance) using arrow keys. Set global gravity to $3.72m/{s}^{2}$. The player must drive over rugged terrain to collect rock samples without flipping over. |
| **3\. Mission 3** | Trash Collector | mission3.html, orbit.js | Build a top-down arcade canvas. The player uses arrow keys to steer a robotic net-satellite in low Earth orbit. The objective is to collect space debris while dodging active ISS supply ships. |

Once you both finish your respective lists, you will each push your branches to GitHub and approve each other's Pull Requests. Because you worked on completely different files (the dashboard vs. the mission files), the code will merge seamlessly.  
Does your friend need the specific Claude Code execution prompts for the Mars Rover and Orbital Trash Collector missions so they can copy and paste them directly into their terminal?