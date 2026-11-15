/*
 * lesson-data.js — Zero-G Academy roadmap content (30 levels in 3 categories).
 * Loaded as a plain script; exposes window.ZGA_LESSONS.
 *
 * Each lesson has three sub-modules (Video, Quiz, Simulation) with custom titles.
 * `minutes` is the estimate and sits inside the category's time window.
 */
(() => {
  const CATEGORIES = {
    easy: {
      key: "easy",
      title: "About Astronauts",
      difficulty: "Easy",
      window: "20–30 mins",
      numerals: "I",
      range: [1, 10],
    },
    medium: {
      key: "medium",
      title: "Spaceships & Robotics",
      difficulty: "Medium",
      window: "15–20 mins",
      numerals: "II",
      range: [11, 20],
    },
    hard: {
      key: "hard",
      title: "Deep Cosmos Exploration",
      difficulty: "Hard",
      window: "30–40 mins",
      numerals: "III",
      range: [21, 30],
    },
  };

  /** Shorthand: [id, category, title, objective, minutes, [videoTitle, quizTitle, simTitle], flag?] */
  const ROWS = [
    [1, "easy", "Gravity & Fall", "Discover why objects fall and how gravity changes on Earth, Mars and the Moon.", 25,
      ["Why everything falls", "Gravity check", "Drop tests on Earth, Mars and Moon"], "Simulation 1"],
    [2, "easy", "Food in Space", "Find out how astronauts pack, heat and enjoy food with no kitchen.", 28,
      ["How astronauts pack meals", "Space menu quiz", "Build a balanced space meal"]],
    [3, "easy", "Breathing Air", "See where station air comes from and how carbon dioxide is removed.", 22,
      ["Where station air comes from", "Air quality quiz", "Scrub the cabin air"]],
    [4, "easy", "Spacesuits & Equipment", "Explore the parts of a spacesuit and the tools that keep astronauts safe.", 26,
      ["Inside a spacesuit", "Suit parts quiz", "Suit up in five steps"]],
    [5, "easy", "Flight Training", "Learn how centrifuges and simulators prepare astronauts for launch forces.", 30,
      ["Spinning in a centrifuge", "Training quiz", "Centrifuge flight sim"]],
    [6, "easy", "Microgravity Exercise", "Discover why astronauts exercise daily to protect muscles and bones.", 24,
      ["Why astronauts exercise", "Muscle quiz", "Floating workout"]],
    [7, "easy", "Zero-G Sleeping", "See how astronauts sleep in bags that hold them gently in place.", 21,
      ["Sleeping while floating", "Sleep quiz", "Find a sleep spot"]],
    [8, "easy", "Water Recycling", "Learn how the station recycles water from sweat, breath and urine.", 27,
      ["Every drop counts", "Water cycle quiz", "Recycle the station water"]],
    [9, "easy", "Radiation Basics", "Understand radiation from the Sun and space, and how crews stay protected.", 23,
      ["What radiation is", "Radiation quiz", "Shield the crew"]],
    [10, "easy", "Heading to Mars", "Follow the long journey to Mars and plan when a launch can happen.", 29,
      ["The trip to Mars", "Mars trip quiz", "Plan a launch window"]],

    [11, "medium", "Rocket Parts", "Name the main parts of a rocket and what each one does.", 16,
      ["Anatomy of a rocket", "Name the parts", "Build a rocket"]],
    [12, "medium", "Rocket Launch", "Follow a rocket launch from countdown to liftoff.", 18,
      ["Countdown to liftoff", "Launch order quiz", "Launch simulator"]],
    [13, "medium", "Getting into Orbit", "Learn how speed and height place a spacecraft into a stable orbit.", 15,
      ["How orbits work", "Orbit quiz", "Speed to orbit"]],
    [14, "medium", "Mars Rovers", "Meet the six-wheeled rovers exploring the red dust of Mars.", 17,
      ["Sapphire Canyon sample", "Mars sample check", "Drive the rover"], "Simulation 2"],
    [15, "medium", "Deep Space Probes", "Learn how probes travel beyond the planets to send back data.", 19,
      ["Probes beyond the planets", "Probe mission quiz", "Probe travel sim"]],
    [16, "medium", "Antennas & Waves", "Discover how antennas send and catch radio waves across space.", 20,
      ["Radio waves 101", "Signal quiz", "Aim the dish"]],
    [17, "medium", "Safe Landing", "Learn how spacecraft slow down and touch down safely on other worlds.", 16,
      ["Landing on other worlds", "Landing quiz", "Land the lander"]],
    [18, "medium", "Space Batteries", "See how solar panels charge batteries that power spacecraft at night.", 18,
      ["Power from sunlight", "Power quiz", "Charge the battery"]],
    [19, "medium", "Space Docking", "Learn how two spacecraft meet, line up and connect in orbit.", 17,
      ["Docking explained", "Docking order quiz", "Dock the spacecraft"]],
    [20, "medium", "Giant Robotic Arms", "Meet the giant robotic arms that grab, move and repair spacecraft.", 19,
      ["Arms in space", "Robot arm quiz", "Grab the satellite"]],

    [21, "hard", "Asteroid Hunting", "Learn how astronomers find and track asteroids that cross Earth's path.", 32,
      ["Rocks from space", "Asteroid quiz", "Track an asteroid"]],
    [22, "hard", "Earth's Shield", "Explore how Earth's magnetic field deflects dangerous charged particles.", 35,
      ["Earth's magnetic field", "Magnetic shield quiz", "Deflect the particles"]],
    [23, "hard", "Wild Solar Weather", "Discover solar flares and storms that can affect satellites and power grids.", 30,
      ["Solar storms", "Space weather quiz", "Forecast a flare"]],
    [24, "hard", "Lunar Bases", "Imagine living and building on the Moon, from dome to power supply.", 38,
      ["Living on the Moon", "Lunar base quiz", "Design a Moon base"]],
    [25, "hard", "Exoplanet Search", "Learn how astronomers find planets orbiting distant stars.", 34,
      ["Planets around other stars", "Transit quiz", "Find the dip"]],
    [26, "hard", "Giant Space Telescopes", "See how giant mirrors and sunshields reveal the faint early universe.", 36,
      ["Seeing the early universe", "Telescope quiz", "Align the mirror"]],
    [27, "hard", "Meet our Sun", "Explore the Sun's layers and why it powers all life on Earth.", 31,
      ["Our star up close", "Sun facts quiz", "Sun layers sim"]],
    [28, "hard", "Black Hole Gravity", "Learn how black holes trap light and pull gas into swirling disks.", 40,
      ["What a black hole is", "Black hole quiz", "Orbit near a black hole"]],
    [29, "hard", "Spiral Galaxies", "Explore spiral galaxies, their arms and the stars inside them.", 33,
      ["Galaxy shapes", "Galaxy quiz", "Build a spiral galaxy"]],
    [30, "hard", "The Mystery of Dark Matter", "Investigate the invisible mass that holds galaxies together.", 37,
      ["The invisible mass", "Dark matter quiz", "Weigh a galaxy"]],
  ];

  const LESSONS = ROWS.map(([id, category, title, objective, minutes, subs, flag]) => ({
    id,
    category,
    title,
    objective,
    minutes,
    subs: {
      video: subs[0],
      quiz: subs[1],
      simulation: subs[2],
    },
    flag: flag || null,
  }));

  window.ZGA_LESSONS = Object.freeze({
    CATEGORIES: Object.freeze(CATEGORIES),
    LESSONS: Object.freeze(LESSONS),
    TASK_KEYS: Object.freeze(["video", "quiz", "simulation"]),
  });
})();
