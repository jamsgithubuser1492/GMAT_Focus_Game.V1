import type { Question } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// GMAT Focus Verbal Reasoning Question Bank
// 25 questions: ~13 reading_comprehension, ~12 critical_reasoning
// Difficulty spread: 5 easy, 8 medium, 7 hard, 5 very hard
// ---------------------------------------------------------------------------

export const verbalQuestions: Question[] = [
  // =========================================================================
  // EASY QUESTIONS (difficulty -2.0 to -1.0) — 5 questions
  // =========================================================================

  // V01 — RC Main Idea (Easy)
  {
    id: "v-001",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-main-idea"],
    difficulty: -1.8,
    discrimination: 1.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Recent studies have shown that companies offering flexible work arrangements experience lower employee turnover and higher job satisfaction scores. Researchers surveyed over 10,000 employees across multiple industries and found that those with remote work options reported 30 percent greater engagement than their in-office counterparts.\n\nWhich of the following best expresses the main idea of the passage?",
      choices: [
        { label: "A", text: "Flexible work arrangements are associated with improved employee retention and satisfaction." },
        { label: "B", text: "Remote work is the only factor that determines employee engagement levels." },
        { label: "C", text: "Companies should eliminate all in-office work requirements immediately." },
        { label: "D", text: "Researchers have proven that in-office employees are always less productive." },
        { label: "E", text: "Employee turnover is unrelated to workplace flexibility policies." },
      ],
    }),
    correctAnswer: "A",
    explanation:
      "The passage directly states that flexible work arrangements correlate with lower turnover and higher satisfaction. Choice A captures this main idea without overstating the findings. The other choices either distort the passage (B, D, E) or draw conclusions the passage does not support (C).",
    estimatedTimeSeconds: 90,
  },

  // V02 — CR Conclusion (Easy)
  {
    id: "v-002",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-conclusion"],
    difficulty: -1.5,
    discrimination: 0.9,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "All of the sales representatives at Brookfield Inc. received bonuses last quarter. Maria is a sales representative at Brookfield Inc.\n\nWhich of the following conclusions can be most properly drawn from the statements above?",
      choices: [
        { label: "A", text: "Maria is the top-performing sales representative at Brookfield Inc." },
        { label: "B", text: "Maria received a bonus last quarter." },
        { label: "C", text: "Brookfield Inc. always gives bonuses to its sales representatives." },
        { label: "D", text: "Maria will receive a bonus next quarter as well." },
        { label: "E", text: "All employees at Brookfield Inc. received bonuses last quarter." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "Since all sales representatives received bonuses and Maria is a sales representative, it necessarily follows that Maria received a bonus. The other choices go beyond what the premises establish: A assumes she is top-performing, C generalizes to all quarters, D predicts the future, and E expands from sales representatives to all employees.",
    estimatedTimeSeconds: 75,
  },

  // V03 — RC Detail (Easy)
  {
    id: "v-003",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-detail"],
    difficulty: -1.3,
    discrimination: 1.1,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "The Pacific salmon's life cycle involves a remarkable migration. Born in freshwater streams, juvenile salmon travel downstream to the ocean, where they spend between one and seven years feeding and growing. When mature, they navigate thousands of miles back to the exact stream where they were born to spawn.\n\nAccording to the passage, where do Pacific salmon spend their juvenile-to-adult growth period?",
      choices: [
        { label: "A", text: "In the freshwater streams where they were born" },
        { label: "B", text: "In the ocean" },
        { label: "C", text: "In lakes adjacent to their birth streams" },
        { label: "D", text: "In rivers that connect to multiple tributaries" },
        { label: "E", text: "In estuaries between freshwater and saltwater zones" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage explicitly states that juvenile salmon 'travel downstream to the ocean, where they spend between one and seven years feeding and growing.' This directly supports choice B. The other options mention locations not described in the passage.",
    estimatedTimeSeconds: 80,
  },

  // V04 — CR Strengthen (Easy)
  {
    id: "v-004",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-strengthen"],
    difficulty: -1.1,
    discrimination: 1.2,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A city council member argues that installing bike lanes on downtown streets will reduce traffic congestion, because more residents will choose to cycle instead of drive.\n\nWhich of the following, if true, most strengthens the council member's argument?",
      choices: [
        { label: "A", text: "Several downtown businesses have complained that bike lanes reduce available parking." },
        { label: "B", text: "A survey shows that 40 percent of downtown commuters live within a bikeable distance and would cycle if safe lanes existed." },
        { label: "C", text: "The city's public transit system has recently expanded its bus routes." },
        { label: "D", text: "Bike lanes are more expensive to maintain than standard road surfaces." },
        { label: "E", text: "Most cycling accidents in the city occur on suburban roads, not downtown streets." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The argument depends on the assumption that a significant number of drivers would switch to cycling. Choice B directly supports this by showing that many commuters both could and would cycle if safe lanes were available. A and D weaken the argument, C is irrelevant to cycling adoption, and E concerns accident locations rather than commuting behavior.",
    estimatedTimeSeconds: 90,
  },

  // V05 — RC Main Idea (Easy)
  {
    id: "v-005",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-main-idea"],
    difficulty: -1.0,
    discrimination: 1.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Microfinance institutions provide small loans to entrepreneurs in developing countries who lack access to traditional banking services. While these loans are typically under $500, they have enabled millions of individuals to start small businesses, purchase equipment, and improve their livelihoods. Critics, however, note that high interest rates can sometimes trap borrowers in cycles of debt.\n\nWhat is the primary purpose of the passage?",
      choices: [
        { label: "A", text: "To argue that microfinance institutions should be abolished" },
        { label: "B", text: "To present microfinance as a development tool while acknowledging its drawbacks" },
        { label: "C", text: "To compare microfinance with traditional banking services in detail" },
        { label: "D", text: "To prove that all microfinance borrowers succeed in business" },
        { label: "E", text: "To explain why high interest rates are necessary in developing economies" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage describes the benefits of microfinance (enabling small businesses and improved livelihoods) while also mentioning the criticism of high interest rates. This balanced treatment is best captured by choice B. The other choices are either too extreme (A, D), too narrow (E), or inaccurate about the passage's scope (C).",
    estimatedTimeSeconds: 90,
  },

  // =========================================================================
  // MEDIUM QUESTIONS (difficulty -0.5 to 0.5) — 8 questions
  // =========================================================================

  // V06 — CR Weaken (Medium)
  {
    id: "v-006",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-weaken"],
    difficulty: -0.4,
    discrimination: 1.4,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A pharmaceutical company claims that its new drug, Cardiflex, reduces the risk of heart attack by 50 percent compared to a placebo, based on a clinical trial in which 200 patients received Cardiflex and 200 received a placebo over two years.\n\nWhich of the following, if true, most seriously weakens the company's claim?",
      choices: [
        { label: "A", text: "Cardiflex has fewer side effects than most competing heart medications." },
        { label: "B", text: "The patients who received Cardiflex were, on average, fifteen years younger and significantly healthier than those who received the placebo." },
        { label: "C", text: "Heart attacks are the leading cause of death in the country where the trial was conducted." },
        { label: "D", text: "The pharmaceutical company has successfully developed other cardiac medications in the past." },
        { label: "E", text: "Some patients in the Cardiflex group also took a daily aspirin regimen." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "If the Cardiflex group was younger and healthier, the lower heart attack rate may be attributable to those demographic differences rather than the drug itself. This selection bias undermines the causal claim. A and D support the company, C is background information, and while E introduces a confound, B is the stronger weakness because it affects the entire treatment group systematically.",
    estimatedTimeSeconds: 100,
  },

  // V07 — RC Inference (Medium)
  {
    id: "v-007",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-inference"],
    difficulty: -0.3,
    discrimination: 1.3,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "The discovery of high-temperature superconductors in the 1980s generated enormous excitement because prior superconductors required cooling to near absolute zero, making practical applications prohibitively expensive. Although the new materials still require significant cooling, they operate at temperatures achievable with liquid nitrogen, which costs less than milk per liter.\n\nIt can be inferred from the passage that which of the following was a major barrier to the widespread use of earlier superconductors?",
      choices: [
        { label: "A", text: "The materials used in earlier superconductors were extremely rare." },
        { label: "B", text: "The cost of cooling earlier superconductors to the required temperatures was impractical." },
        { label: "C", text: "Earlier superconductors could not carry sufficient electrical current." },
        { label: "D", text: "Liquid nitrogen was not available during the era of earlier superconductors." },
        { label: "E", text: "Governments banned the use of superconductors for commercial purposes." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage states that prior superconductors required cooling to near absolute zero, 'making practical applications prohibitively expensive.' This implies the cost of achieving such extreme cooling was the barrier. Choice B captures this inference. The passage says nothing about material rarity (A), current capacity (C), nitrogen availability (D), or government bans (E).",
    estimatedTimeSeconds: 100,
  },

  // V08 — CR Assumption (Medium)
  {
    id: "v-008",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-assumption"],
    difficulty: -0.1,
    discrimination: 1.5,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Restaurant owner: Our restaurant's declining revenue must be due to the new highway bypass that diverts traffic away from our street. Before the bypass opened six months ago, our revenue had been stable for years.\n\nThe restaurant owner's argument depends on which of the following assumptions?",
      choices: [
        { label: "A", text: "No other restaurant in the area has experienced a decline in revenue." },
        { label: "B", text: "The restaurant has not changed its menu, prices, or service quality in a way that could account for the revenue decline." },
        { label: "C", text: "The highway bypass was built specifically to reduce traffic on the restaurant's street." },
        { label: "D", text: "Restaurants located on highways always earn more revenue than those on side streets." },
        { label: "E", text: "The restaurant owner plans to relocate the business closer to the new highway." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The owner attributes the revenue decline solely to the highway bypass. This reasoning assumes that no other factor (menu changes, pricing, service quality) explains the decline. If the restaurant had also raised prices or lowered quality, the bypass might not be the cause. Choice B identifies this necessary assumption. The other options are either irrelevant (C, E) or make claims the argument does not require (A, D).",
    estimatedTimeSeconds: 100,
  },

  // V09 — RC Detail (Medium)
  {
    id: "v-009",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-detail"],
    difficulty: 0.0,
    discrimination: 1.3,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "The gig economy, characterized by short-term contracts and freelance work rather than permanent employment, has grown rapidly since 2010. Proponents argue that it offers workers greater flexibility and autonomy. However, a recent labor department report found that gig workers earn, on average, 58 percent of the hourly wage of comparable full-time employees and rarely receive employer-sponsored health insurance.\n\nAccording to the passage, which of the following is true about gig workers relative to full-time employees?",
      choices: [
        { label: "A", text: "Gig workers report higher job satisfaction than full-time employees." },
        { label: "B", text: "Gig workers typically earn more per hour than full-time employees." },
        { label: "C", text: "Gig workers earn on average 58 percent of the hourly wage of comparable full-time employees." },
        { label: "D", text: "Gig workers receive the same benefits as full-time employees." },
        { label: "E", text: "Gig workers have been steadily declining in number since 2010." },
      ],
    }),
    correctAnswer: "C",
    explanation:
      "The passage explicitly states that 'gig workers earn, on average, 58 percent of the hourly wage of comparable full-time employees.' Choice C directly restates this detail. A is not mentioned, B contradicts the passage, D contradicts the statement about health insurance, and E contradicts the claim of rapid growth.",
    estimatedTimeSeconds: 85,
  },

  // V10 — CR Evaluate (Medium)
  {
    id: "v-010",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-evaluate"],
    difficulty: 0.1,
    discrimination: 1.4,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Mayor: Our city's new recycling program has been a success. In the first year since the program began, the amount of waste sent to landfills decreased by 15 percent.\n\nWhich of the following would be most useful to determine whether the mayor's claim is valid?",
      choices: [
        { label: "A", text: "Whether the city's population changed significantly during the same year" },
        { label: "B", text: "Whether other cities have implemented similar recycling programs" },
        { label: "C", text: "Whether the mayor plans to expand the recycling program next year" },
        { label: "D", text: "Whether landfill operators support the recycling program" },
        { label: "E", text: "Whether the recycling program received media coverage" },
      ],
    }),
    correctAnswer: "A",
    explanation:
      "If the city's population decreased significantly, the reduction in landfill waste might be due to fewer residents rather than successful recycling. Knowing whether population changed helps evaluate the causal claim. B, C, D, and E are tangential to whether the recycling program actually caused the waste reduction.",
    estimatedTimeSeconds: 95,
  },

  // V11 — RC Inference (Medium)
  {
    id: "v-011",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-inference"],
    difficulty: 0.2,
    discrimination: 1.5,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "In the early twentieth century, the prevailing view among geologists was that the continents were fixed in their positions. Alfred Wegener proposed the theory of continental drift in 1912, citing evidence such as matching fossil records and coastline shapes across continents. His theory was widely rejected during his lifetime, primarily because he could not identify a mechanism powerful enough to move entire continents.\n\nWhich of the following can be most reasonably inferred from the passage?",
      choices: [
        { label: "A", text: "Wegener's theory was rejected because the evidence he cited was fabricated." },
        { label: "B", text: "The geological community valued explanatory mechanisms in addition to observational evidence when evaluating theories." },
        { label: "C", text: "No other scientist supported the theory of continental drift during Wegener's lifetime." },
        { label: "D", text: "Wegener eventually discovered the mechanism behind continental drift before his death." },
        { label: "E", text: "The matching coastline shapes were later shown to be coincidental." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage states that Wegener had observational evidence (fossils, coastlines) but was rejected because he lacked a causal mechanism. This implies the scientific community required both evidence and a credible mechanism. Choice B captures this inference. A mischaracterizes the rejection, C overstates the opposition, D contradicts the passage, and E is unsupported.",
    estimatedTimeSeconds: 105,
  },

  // V12 — CR Strengthen (Medium)
  {
    id: "v-012",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-strengthen"],
    difficulty: 0.3,
    discrimination: 1.2,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A school district introduced a free breakfast program, hypothesizing that it would improve students' academic performance. After one year, average test scores across the district rose by 8 percent.\n\nWhich of the following, if true, most strengthens the conclusion that the breakfast program caused the improvement in test scores?",
      choices: [
        { label: "A", text: "The district also hired 20 new teachers during the same year." },
        { label: "B", text: "Neighboring districts that did not introduce breakfast programs saw no change in test scores during the same period." },
        { label: "C", text: "The breakfast program cost less than originally budgeted." },
        { label: "D", text: "Some students chose not to participate in the breakfast program." },
        { label: "E", text: "The district's student population grew by 5 percent during the year." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "Choice B provides a control comparison: similar districts without the program did not improve, suggesting the breakfast program was the differentiating factor. A introduces an alternative explanation that weakens the causal link. C is about cost, not effectiveness. D suggests incomplete participation, which if anything weakens the claim. E is irrelevant.",
    estimatedTimeSeconds: 95,
  },

  // V13 — RC Main Idea (Medium)
  {
    id: "v-013",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-main-idea"],
    difficulty: 0.5,
    discrimination: 1.6,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Behavioral economists have challenged the classical assumption that individuals make rational decisions by demonstrating systematic cognitive biases. For instance, people tend to overvalue items they already own, a phenomenon known as the endowment effect, and they are disproportionately influenced by how choices are framed rather than by the objective outcomes. These findings have prompted governments to adopt 'nudge' policies that structure choices to guide citizens toward beneficial decisions without restricting freedom.\n\nWhich of the following best describes the main point of the passage?",
      choices: [
        { label: "A", text: "Governments should restrict individual choice to prevent irrational decisions." },
        { label: "B", text: "Behavioral economics research on cognitive biases has influenced public policy approaches to decision-making." },
        { label: "C", text: "The endowment effect is the most important cognitive bias discovered by behavioral economists." },
        { label: "D", text: "Classical economics provides a more accurate model of decision-making than behavioral economics." },
        { label: "E", text: "Nudge policies have failed to produce measurable improvements in citizen welfare." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage traces a logical arc from cognitive bias research to its influence on government 'nudge' policies. Choice B accurately summarizes this main point. A contradicts the passage's mention of 'without restricting freedom.' C focuses too narrowly on one example. D contradicts the passage's framing. E makes a claim the passage does not support.",
    estimatedTimeSeconds: 100,
  },

  // =========================================================================
  // HARD QUESTIONS (difficulty 0.5 to 1.5) — 7 questions
  // =========================================================================

  // V14 — CR Assumption (Hard)
  {
    id: "v-014",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-assumption"],
    difficulty: 0.6,
    discrimination: 1.7,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Corporate consultant: Companies that adopt open-plan offices will see improved collaboration among employees. When physical barriers between workspaces are removed, employees naturally engage in more spontaneous conversations, which leads to better idea sharing and innovation.\n\nThe consultant's argument assumes which of the following?",
      choices: [
        { label: "A", text: "Open-plan offices are less expensive to build than traditional offices with private rooms." },
        { label: "B", text: "Spontaneous conversations in open-plan offices tend to be work-related and productive rather than distracting." },
        { label: "C", text: "All employees prefer working in open-plan offices to working in private offices." },
        { label: "D", text: "Companies that have adopted open-plan offices are generally more profitable." },
        { label: "E", text: "Innovation is the most important factor in a company's long-term success." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The consultant's argument links more spontaneous conversations to better idea sharing and innovation. This chain of reasoning assumes that the increased conversations are actually productive and work-related. If the conversations were primarily social distractions, more of them would not lead to improved collaboration. A concerns cost, C concerns preference, D concerns profitability, and E concerns the importance of innovation — none are required by the argument's logic.",
    estimatedTimeSeconds: 110,
  },

  // V15 — RC Inference (Hard)
  {
    id: "v-015",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-inference"],
    difficulty: 0.8,
    discrimination: 1.6,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "The introduction of automated teller machines in the 1970s was widely expected to decimate bank teller employment. Paradoxically, the number of bank tellers in the United States actually increased from 1970 to 2010. Economists explain that ATMs reduced the cost of operating a bank branch so substantially that banks opened many more branches, and the new branches collectively required more tellers than the ATMs displaced.\n\nThe passage most strongly suggests which of the following about the relationship between automation and employment?",
      choices: [
        { label: "A", text: "Automation invariably leads to job losses in the industry where it is introduced." },
        { label: "B", text: "The employment effects of automation can depend on whether cost savings lead to industry expansion." },
        { label: "C", text: "Bank tellers' job duties remained unchanged after the introduction of ATMs." },
        { label: "D", text: "ATMs were less reliable than bank tellers at handling financial transactions." },
        { label: "E", text: "The number of bank tellers has continued to increase since 2010." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage illustrates that ATMs lowered branch costs, enabling banks to expand (more branches), which in turn increased total teller employment. This demonstrates that automation's employment effect depends on whether cost savings drive industry expansion. Choice A contradicts the passage's example. C, D, and E are not supported by the passage.",
    estimatedTimeSeconds: 110,
  },

  // V16 — CR Weaken (Hard)
  {
    id: "v-016",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-weaken"],
    difficulty: 1.0,
    discrimination: 1.8,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Marketing director: Our company should shift its entire advertising budget from television to social media. Data from the last quarter shows that our social media campaigns generated three times as many customer inquiries per dollar spent as our television advertisements did.\n\nWhich of the following, if true, most seriously weakens the marketing director's argument?",
      choices: [
        { label: "A", text: "The company's main competitors spend more on television advertising than on social media advertising." },
        { label: "B", text: "Customer inquiries generated by social media result in actual purchases at one-fifth the rate of those generated by television advertising." },
        { label: "C", text: "The company has been steadily increasing its social media budget over the past three years." },
        { label: "D", text: "Television advertising reaches a broader demographic than social media advertising." },
        { label: "E", text: "The marketing director has more experience with social media campaigns than television campaigns." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The director uses customer inquiries as the metric, but if social media inquiries convert to actual sales at one-fifth the rate of television inquiries, then the apparently superior cost-efficiency of social media disappears when measured by revenue generated. This directly undermines the rationale for the shift. A and E are irrelevant to the cost-effectiveness comparison. C is background information. D is relevant but less damaging than B, which quantifies the conversion gap.",
    estimatedTimeSeconds: 110,
  },

  // V17 — RC Detail (Hard)
  {
    id: "v-017",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-detail"],
    difficulty: 1.1,
    discrimination: 1.5,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "The Dutch East India Company, established in 1602, is often considered the world's first publicly traded corporation. It was granted a government monopoly on trade in Asia and at its peak controlled a private army of 10,000 soldiers. Historians debate whether its success was primarily due to its innovative financial structure, which allowed ordinary citizens to buy shares, or to the military force it deployed to eliminate competitors.\n\nAccording to the passage, which of the following is a subject of debate among historians?",
      choices: [
        { label: "A", text: "Whether the Dutch East India Company was truly the first publicly traded corporation" },
        { label: "B", text: "Whether the company's success stemmed more from its financial structure or from its military power" },
        { label: "C", text: "Whether ordinary citizens profited from owning shares in the company" },
        { label: "D", text: "Whether the company's monopoly was granted legally" },
        { label: "E", text: "Whether the company had more than 10,000 soldiers at its peak" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage states that 'historians debate whether its success was primarily due to its innovative financial structure... or to the military force it deployed.' This directly matches choice B. The passage presents A as accepted fact ('is often considered'), and C, D, and E are not mentioned as subjects of debate.",
    estimatedTimeSeconds: 100,
  },

  // V18 — CR Evaluate (Hard)
  {
    id: "v-018",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-evaluate"],
    difficulty: 1.2,
    discrimination: 1.9,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Researcher: Our study found that children who eat dinner with their families at least five times a week are 35 percent less likely to develop substance abuse problems as teenagers. Therefore, parents should prioritize regular family dinners to protect their children from substance abuse.\n\nWhich of the following would be most important to evaluate in assessing the researcher's recommendation?",
      choices: [
        { label: "A", text: "Whether the study controlled for factors such as parental involvement and household income that correlate with both family dinners and lower substance abuse rates" },
        { label: "B", text: "Whether the study was published in a peer-reviewed journal" },
        { label: "C", text: "Whether the researcher has children of her own" },
        { label: "D", text: "Whether the families in the study enjoyed the dinners they ate together" },
        { label: "E", text: "Whether substance abuse rates among teenagers have increased nationally in recent years" },
      ],
    }),
    correctAnswer: "A",
    explanation:
      "The researcher leaps from a correlation (family dinners associated with less substance abuse) to a causal recommendation. To evaluate this, we must know whether confounding variables were controlled. Families that dine together may also differ in income, parenting style, and supervision, all of which independently reduce substance abuse risk. Choice A addresses this critical confounding issue. B, C, D, and E are far less relevant to the causal claim.",
    estimatedTimeSeconds: 115,
  },

  // V19 — RC Inference (Hard)
  {
    id: "v-019",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-inference"],
    difficulty: 1.3,
    discrimination: 1.7,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Despite comprising less than 2 percent of the Earth's surface, tropical coral reefs harbor approximately 25 percent of all marine species. This extraordinary biodiversity is sustained by a symbiotic relationship between coral polyps and photosynthetic algae called zooxanthellae. When ocean temperatures rise even slightly, corals expel these algae in a stress response known as bleaching; without the algae, the corals lose their primary energy source and often die within weeks.\n\nIt can be inferred from the passage that if ocean temperatures continue to rise, which of the following outcomes is most likely?",
      choices: [
        { label: "A", text: "Coral reefs will adapt by forming symbiotic relationships with heat-resistant organisms." },
        { label: "B", text: "A significant proportion of the world's marine species could lose their habitat." },
        { label: "C", text: "Zooxanthellae populations will increase due to warmer water conditions." },
        { label: "D", text: "Coral bleaching events will become less frequent as corals develop thermal tolerance." },
        { label: "E", text: "Marine biodiversity will shift to deep-ocean hydrothermal vent communities." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage establishes two key facts: reefs harbor 25 percent of marine species, and rising temperatures cause coral death through bleaching. Combining these, continued warming would cause widespread coral death, eliminating habitat for a substantial share of marine species. Choice B follows logically. A and D assume adaptation not mentioned in the passage. C contradicts the described expulsion of algae. E introduces an unsupported claim.",
    estimatedTimeSeconds: 115,
  },

  // V20 — CR Weaken (Hard)
  {
    id: "v-020",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-weaken"],
    difficulty: 1.4,
    discrimination: 1.6,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "City planner: The sharp increase in housing prices in our city over the past five years is primarily caused by restrictive zoning laws that limit new construction. Cities with less restrictive zoning have not experienced comparable price increases during the same period.\n\nWhich of the following, if true, most seriously weakens the city planner's argument?",
      choices: [
        { label: "A", text: "The city has experienced a 40 percent increase in high-income technology workers during the past five years, far exceeding growth in comparable cities." },
        { label: "B", text: "Several neighboring cities with similarly restrictive zoning laws have also seen housing price increases." },
        { label: "C", text: "The city's zoning laws have not changed in the past ten years." },
        { label: "D", text: "Some residents prefer restrictive zoning because it preserves neighborhood character." },
        { label: "E", text: "Housing prices in the city decreased briefly during a national recession three years ago." },
      ],
    }),
    correctAnswer: "A",
    explanation:
      "The planner attributes rising prices to zoning restrictions. However, if the city saw a massive influx of high-income workers (a demand-side shock unique to this city), that alone could explain the price increase regardless of zoning. This provides a strong alternative explanation. B actually supports the argument by showing that restrictive zoning correlates with price increases. C is neutral or could support the argument. D and E are tangential.",
    estimatedTimeSeconds: 120,
  },

  // =========================================================================
  // VERY HARD QUESTIONS (difficulty 1.5 to 2.5) — 5 questions
  // =========================================================================

  // V21 — CR Assumption (Very Hard)
  {
    id: "v-021",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-assumption"],
    difficulty: 1.6,
    discrimination: 2.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Art critic: The dramatic increase in prices for contemporary digital art at auction proves that the art market now values digital works as highly as traditional oil paintings. Last year, the top ten digital art sales totaled $150 million, approaching the $180 million total for the top ten oil painting sales.\n\nThe art critic's reasoning is flawed unless which of the following is assumed?",
      choices: [
        { label: "A", text: "Digital art requires as much technical skill to produce as oil painting." },
        { label: "B", text: "The number of digital artworks offered at auction is comparable to the number of oil paintings offered, so that the top-ten comparison reflects equivalent market depth." },
        { label: "C", text: "Auction prices for digital art will continue to rise in the coming years." },
        { label: "D", text: "Oil paintings have been sold at auction for a much longer period than digital artworks." },
        { label: "E", text: "The same collectors who purchase oil paintings also purchase digital art." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The critic compares the top ten sales in each category. If there are thousands of oil paintings but only a few dozen digital works at auction, the top ten digital prices could be high simply because all digital works happen to sell at premium prices to a niche market, not because the broader market values them equally. The comparison is only meaningful if market depth (volume offered) is comparable. A is about skill, C is a prediction, D is historical background, and E is about collector overlap — none are required for the argument to hold.",
    estimatedTimeSeconds: 130,
  },

  // V22 — RC Inference (Very Hard)
  {
    id: "v-022",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-inference", "v-rc-main-idea"],
    difficulty: 1.8,
    discrimination: 2.1,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Economists studying the 'resource curse' have observed that countries rich in natural resources such as oil and minerals often experience slower economic growth than resource-poor countries. One explanation is that resource wealth encourages governments to neglect investments in education and manufacturing, since resource extraction revenues provide an easier fiscal path. Additionally, resource booms tend to inflate the local currency, making non-resource exports uncompetitive internationally — a phenomenon economists call 'Dutch disease.'\n\nWhich of the following can be most reasonably inferred from the passage?",
      choices: [
        { label: "A", text: "Countries without natural resources never experience currency inflation." },
        { label: "B", text: "A resource-rich country that deliberately invests in education and manufacturing might mitigate the negative effects of the resource curse." },
        { label: "C", text: "Dutch disease was first observed in the Netherlands' tulip industry." },
        { label: "D", text: "Resource-poor countries always grow faster than resource-rich countries." },
        { label: "E", text: "The resource curse is primarily a political phenomenon unrelated to economics." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage identifies two mechanisms of the resource curse: neglect of education/manufacturing investment and Dutch disease. If neglecting these investments is a cause, then actively making those investments could logically mitigate the curse. Choice B follows from the passage's reasoning. A makes an absolute claim not supported. C is about the origin of the term, not discussed. D uses 'always,' which is too strong — the passage says 'often.' E contradicts the passage's economic framing.",
    estimatedTimeSeconds: 125,
  },

  // V23 — CR Evaluate (Very Hard)
  {
    id: "v-023",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-evaluate"],
    difficulty: 2.0,
    discrimination: 2.2,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "CEO: We should acquire Startup X because its machine-learning algorithm has demonstrated a 95 percent accuracy rate in predicting consumer purchasing behavior, which would give us a significant competitive advantage. Our current system achieves only 70 percent accuracy.\n\nEach of the following, if true, would cast doubt on the CEO's reasoning EXCEPT:",
      choices: [
        { label: "A", text: "Startup X's algorithm was trained and tested on data from a single industry that differs substantially from the CEO's company." },
        { label: "B", text: "The 95 percent accuracy rate was measured on the training data set rather than on an independent validation set." },
        { label: "C", text: "Startup X's algorithm requires computing infrastructure that costs ten times the projected revenue gain." },
        { label: "D", text: "Several competing firms are developing algorithms that have shown comparable accuracy rates in independent tests." },
        { label: "E", text: "Consumer purchasing behavior in the CEO's industry has remained stable over the past decade, making predictions easier regardless of the algorithm used." },
      ],
    }),
    correctAnswer: "E",
    explanation:
      "The question asks for the option that does NOT cast doubt. A weakens by questioning generalizability. B weakens by suggesting overfitting. C weakens by questioning cost-effectiveness. D weakens by challenging the uniqueness of the competitive advantage. E, however, actually supports the idea that the algorithm would work in the CEO's industry (stable patterns are easier to predict), and does not undermine the logic of acquiring it. Therefore E is the exception.",
    estimatedTimeSeconds: 140,
  },

  // V24 — RC Main Idea + Inference (Very Hard)
  {
    id: "v-024",
    section: "verbal",
    questionType: "reading_comprehension",
    skillNodeIds: ["v-rc-main-idea", "v-rc-inference"],
    difficulty: 2.2,
    discrimination: 1.9,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "The prevailing model of organizational change assumes that successful transformation requires strong top-down leadership. However, recent research on complex adaptive systems suggests an alternative: organizations, like ecosystems, can undergo productive change through the accumulation of small, decentralized adaptations by individual actors. In this view, the leader's role shifts from directing change to cultivating conditions — such as psychological safety and information transparency — under which emergent innovation can flourish.\n\nThe author of the passage would most likely agree with which of the following statements?",
      choices: [
        { label: "A", text: "Top-down leadership is always counterproductive during periods of organizational change." },
        { label: "B", text: "Leaders can facilitate change effectively by enabling decentralized innovation rather than solely directing it." },
        { label: "C", text: "Complex adaptive systems theory is irrelevant to the study of organizations." },
        { label: "D", text: "Psychological safety and information transparency are sufficient on their own to guarantee successful change." },
        { label: "E", text: "Individual actors in an organization are incapable of producing meaningful innovation without direct leadership." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The passage contrasts top-down leadership with a decentralized model and concludes that a leader's role should shift to 'cultivating conditions' for emergent innovation. This aligns with B. A is too extreme — the passage presents an alternative, not a rejection of top-down approaches. C contradicts the passage. D overstates the claims about safety and transparency (conditions that help, but are not called sufficient). E contradicts the passage's central thesis.",
    estimatedTimeSeconds: 130,
  },

  // V25 — CR Weaken (Very Hard)
  {
    id: "v-025",
    section: "verbal",
    questionType: "critical_reasoning",
    skillNodeIds: ["v-cr-weaken", "v-cr-assumption"],
    difficulty: 2.4,
    discrimination: 2.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Economist: Country Z's new policy of subsidizing domestic semiconductor production will strengthen its economic security by reducing dependence on foreign chip imports. Currently, 90 percent of the semiconductors used in Country Z are imported, and disruptions to the supply chain have caused significant economic losses. By offering subsidies, the government will encourage domestic firms to build fabrication plants, and within a decade the country will produce the majority of the chips it needs.\n\nWhich of the following, if true, most seriously undermines the economist's prediction?",
      choices: [
        { label: "A", text: "Country Z currently has a trade surplus with its primary semiconductor supplier." },
        { label: "B", text: "The most advanced semiconductor fabrication processes require specialized equipment that is manufactured exclusively by firms in two foreign countries, both of which restrict its export to Country Z." },
        { label: "C", text: "Domestic semiconductor production would create thousands of high-paying jobs in Country Z." },
        { label: "D", text: "Some of Country Z's existing technology companies have expressed interest in entering the semiconductor market." },
        { label: "E", text: "Country Z's government has successfully subsidized other industries in the past." },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The economist's prediction assumes Country Z can build the necessary fabrication plants. If the essential manufacturing equipment is only available from two foreign countries that both restrict exports to Country Z, then subsidies alone cannot enable domestic production. This directly undermines the feasibility of the plan. A is about trade balance, not production capacity. C supports the policy's benefits. D mildly supports feasibility. E provides a precedent that supports the policy, not undermines it.",
    estimatedTimeSeconds: 140,
  },
];
