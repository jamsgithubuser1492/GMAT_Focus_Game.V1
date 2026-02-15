import type { Question } from "@/lib/tutor-engine/types";

/**
 * GMAT Focus Edition — Quantitative Reasoning (Problem Solving) Item Bank
 *
 * 25 five-choice multiple-choice questions calibrated with 3PL IRT parameters.
 *
 * Difficulty spread:
 *   5 easy      (b: -2.0 to -1.0)
 *   8 medium    (b: -0.5 to  0.5)
 *   7 hard      (b:  0.5 to  1.5)
 *   5 very hard (b:  1.5 to  2.5)
 */

export const quantitativeQuestions: Question[] = [
  // ==========================================================================
  // EASY (5 questions, difficulty -2.0 to -1.0)
  // ==========================================================================
  {
    id: "quant-001",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-algebra-1"],
    difficulty: -1.8,
    discrimination: 1.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "If 3x + 7 = 22, what is the value of x?",
      choices: [
        { label: "A", text: "3" },
        { label: "B", text: "5" },
        { label: "C", text: "7" },
        { label: "D", text: "8" },
        { label: "E", text: "10" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
    estimatedTimeSeconds: 45,
  },
  {
    id: "quant-002",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-arithmetic-1"],
    difficulty: -1.5,
    discrimination: 0.9,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "What is the greatest common factor of 36 and 48?",
      choices: [
        { label: "A", text: "4" },
        { label: "B", text: "6" },
        { label: "C", text: "8" },
        { label: "D", text: "12" },
        { label: "E", text: "24" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "36 = 2^2 * 3^2 and 48 = 2^4 * 3. The GCF takes the minimum power of each shared prime: 2^2 * 3 = 12.",
    estimatedTimeSeconds: 60,
  },
  {
    id: "quant-003",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-word-problems-1"],
    difficulty: -1.2,
    discrimination: 1.1,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A shirt originally priced at $80 is on sale for 25% off. What is the sale price?",
      choices: [
        { label: "A", text: "$20" },
        { label: "B", text: "$40" },
        { label: "C", text: "$55" },
        { label: "D", text: "$60" },
        { label: "E", text: "$65" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "25% of $80 = $20. Sale price = $80 - $20 = $60.",
    estimatedTimeSeconds: 45,
  },
  {
    id: "quant-004",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-geometry-1"],
    difficulty: -1.6,
    discrimination: 1.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "What is the area of a rectangle with length 12 and width 5?",
      choices: [
        { label: "A", text: "17" },
        { label: "B", text: "34" },
        { label: "C", text: "48" },
        { label: "D", text: "60" },
        { label: "E", text: "72" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "Area of a rectangle = length * width = 12 * 5 = 60.",
    estimatedTimeSeconds: 30,
  },
  {
    id: "quant-005",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-statistics-1"],
    difficulty: -1.0,
    discrimination: 1.2,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "What is the median of the set {3, 7, 1, 9, 5}?",
      choices: [
        { label: "A", text: "3" },
        { label: "B", text: "5" },
        { label: "C", text: "6" },
        { label: "D", text: "7" },
        { label: "E", text: "9" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "Arrange the numbers in order: {1, 3, 5, 7, 9}. The middle value is 5.",
    estimatedTimeSeconds: 45,
  },

  // ==========================================================================
  // MEDIUM (8 questions, difficulty -0.5 to 0.5)
  // ==========================================================================
  {
    id: "quant-006",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-algebra-1", "q-algebra-2"],
    difficulty: -0.4,
    discrimination: 1.3,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "If 2(x - 3) + 4 = 3x - 1, what is the value of x?",
      choices: [
        { label: "A", text: "-1" },
        { label: "B", text: "0" },
        { label: "C", text: "1" },
        { label: "D", text: "3" },
        { label: "E", text: "-3" },
      ],
    }),
    correctAnswer: "A",
    explanation:
      "Expand the left side: 2x - 6 + 4 = 3x - 1, so 2x - 2 = 3x - 1. Subtract 2x from both sides: -2 = x - 1. Add 1 to both sides: x = -1.",
    estimatedTimeSeconds: 75,
  },
  {
    id: "quant-007",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-arithmetic-1", "q-arithmetic-2"],
    difficulty: -0.2,
    discrimination: 1.4,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "When a positive integer n is divided by 7, the remainder is 4. What is the remainder when 3n is divided by 7?",
      choices: [
        { label: "A", text: "1" },
        { label: "B", text: "2" },
        { label: "C", text: "4" },
        { label: "D", text: "5" },
        { label: "E", text: "6" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "Since n leaves remainder 4 when divided by 7, we can write n = 7k + 4 for some non-negative integer k. Then 3n = 21k + 12 = 7(3k + 1) + 5. The remainder when 3n is divided by 7 is 5.",
    estimatedTimeSeconds: 90,
  },
  {
    id: "quant-008",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-word-problems-1", "q-word-problems-2"],
    difficulty: 0.0,
    discrimination: 1.5,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Machine A can complete a job in 6 hours and Machine B can complete the same job in 4 hours. Working together, how many hours will it take them to complete the job?",
      choices: [
        { label: "A", text: "2.0" },
        { label: "B", text: "2.4" },
        { label: "C", text: "3.0" },
        { label: "D", text: "3.5" },
        { label: "E", text: "5.0" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "Rate of A = 1/6 job per hour; rate of B = 1/4 job per hour. Combined rate = 1/6 + 1/4 = 2/12 + 3/12 = 5/12 jobs per hour. Time = 1 / (5/12) = 12/5 = 2.4 hours.",
    estimatedTimeSeconds: 90,
  },
  {
    id: "quant-009",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-word-problems-2"],
    difficulty: 0.2,
    discrimination: 1.3,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A mixture contains milk and water in the ratio 3:2. If 10 liters of water are added, the ratio becomes 3:4. How many liters of milk are in the mixture?",
      choices: [
        { label: "A", text: "10" },
        { label: "B", text: "12" },
        { label: "C", text: "15" },
        { label: "D", text: "18" },
        { label: "E", text: "20" },
      ],
    }),
    correctAnswer: "C",
    explanation:
      "Let the original quantities be 3k (milk) and 2k (water). After adding 10 liters of water: 3k / (2k + 10) = 3/4. Cross-multiply: 12k = 6k + 30, so 6k = 30 and k = 5. Milk = 3(5) = 15 liters.",
    estimatedTimeSeconds: 120,
  },
  {
    id: "quant-010",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-geometry-1", "q-geometry-2"],
    difficulty: 0.1,
    discrimination: 1.2,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A circle has an area of 64\u03c0. What is the circumference of the circle?",
      choices: [
        { label: "A", text: "8\u03c0" },
        { label: "B", text: "16\u03c0" },
        { label: "C", text: "32\u03c0" },
        { label: "D", text: "64\u03c0" },
        { label: "E", text: "128\u03c0" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "Area = \u03c0r\u00b2 = 64\u03c0, so r\u00b2 = 64 and r = 8. Circumference = 2\u03c0r = 2\u03c0(8) = 16\u03c0.",
    estimatedTimeSeconds: 60,
  },
  {
    id: "quant-011",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-algebra-2"],
    difficulty: 0.3,
    discrimination: 1.6,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "If x\u00b2 - 5x + 6 = 0, what is the sum of all possible values of 2x + 1?",
      choices: [
        { label: "A", text: "5" },
        { label: "B", text: "7" },
        { label: "C", text: "10" },
        { label: "D", text: "12" },
        { label: "E", text: "15" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "Factor: (x - 2)(x - 3) = 0, so x = 2 or x = 3. When x = 2: 2(2) + 1 = 5. When x = 3: 2(3) + 1 = 7. Sum = 5 + 7 = 12.",
    estimatedTimeSeconds: 90,
  },
  {
    id: "quant-012",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-statistics-1"],
    difficulty: -0.3,
    discrimination: 1.1,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "The average (arithmetic mean) of five numbers is 20. If one of the numbers is removed, the average of the remaining four numbers is 18. What is the number that was removed?",
      choices: [
        { label: "A", text: "22" },
        { label: "B", text: "24" },
        { label: "C", text: "26" },
        { label: "D", text: "28" },
        { label: "E", text: "30" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "Sum of five numbers = 5 * 20 = 100. Sum of remaining four = 4 * 18 = 72. The removed number = 100 - 72 = 28.",
    estimatedTimeSeconds: 60,
  },
  {
    id: "quant-013",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-arithmetic-2"],
    difficulty: 0.5,
    discrimination: 1.4,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "How many positive integers less than 100 are divisible by both 3 and 5 but not by 4?",
      choices: [
        { label: "A", text: "3" },
        { label: "B", text: "4" },
        { label: "C", text: "5" },
        { label: "D", text: "6" },
        { label: "E", text: "7" },
      ],
    }),
    correctAnswer: "C",
    explanation:
      "Divisible by both 3 and 5 means divisible by 15. Multiples of 15 less than 100: 15, 30, 45, 60, 75, 90 (six numbers). Of these, only 60 is also divisible by 4. So the count is 6 - 1 = 5.",
    estimatedTimeSeconds: 90,
  },

  // ==========================================================================
  // HARD (7 questions, difficulty 0.5 to 1.5)
  // ==========================================================================
  {
    id: "quant-014",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-algebra-2", "q-algebra-3"],
    difficulty: 0.7,
    discrimination: 1.6,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "If |2x - 5| \u2264 7, how many integer values of x satisfy the inequality?",
      choices: [
        { label: "A", text: "5" },
        { label: "B", text: "6" },
        { label: "C", text: "7" },
        { label: "D", text: "8" },
        { label: "E", text: "9" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "|2x - 5| \u2264 7 means -7 \u2264 2x - 5 \u2264 7. Add 5 to all parts: -2 \u2264 2x \u2264 12. Divide by 2: -1 \u2264 x \u2264 6. The integer values are -1, 0, 1, 2, 3, 4, 5, 6, which is 8 integers.",
    estimatedTimeSeconds: 90,
  },
  {
    id: "quant-015",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-geometry-2"],
    difficulty: 0.9,
    discrimination: 1.5,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "In the xy-plane, what is the distance between the points (-3, 4) and (5, -2)?",
      choices: [
        { label: "A", text: "6" },
        { label: "B", text: "8" },
        { label: "C", text: "10" },
        { label: "D", text: "12" },
        { label: "E", text: "14" },
      ],
    }),
    correctAnswer: "C",
    explanation:
      "Distance = \u221a[(5 - (-3))\u00b2 + (-2 - 4)\u00b2] = \u221a[8\u00b2 + (-6)\u00b2] = \u221a[64 + 36] = \u221a100 = 10.",
    estimatedTimeSeconds: 75,
  },
  {
    id: "quant-016",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-word-problems-2"],
    difficulty: 1.0,
    discrimination: 1.7,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Train A leaves Station X at 9:00 AM traveling at 60 mph toward Station Y. Train B leaves Station Y at 10:00 AM traveling at 90 mph toward Station X. If the distance between the two stations is 300 miles, at what time do the trains meet?",
      choices: [
        { label: "A", text: "11:00 AM" },
        { label: "B", text: "11:20 AM" },
        { label: "C", text: "11:36 AM" },
        { label: "D", text: "11:40 AM" },
        { label: "E", text: "12:00 PM" },
      ],
    }),
    correctAnswer: "C",
    explanation:
      "By 10:00 AM, Train A has traveled 60 miles, leaving 300 - 60 = 240 miles between the trains. Combined closing speed = 60 + 90 = 150 mph. Time to meet after 10:00 AM = 240 / 150 = 1.6 hours = 1 hour and 36 minutes. The trains meet at 11:36 AM.",
    estimatedTimeSeconds: 150,
  },
  {
    id: "quant-017",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-arithmetic-2", "q-word-problems-2"],
    difficulty: 1.2,
    discrimination: 1.8,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A store offers a 20% discount on an item, and then an additional 10% discount on the reduced price. What single discount percentage is equivalent to these two successive discounts?",
      choices: [
        { label: "A", text: "25%" },
        { label: "B", text: "28%" },
        { label: "C", text: "29%" },
        { label: "D", text: "30%" },
        { label: "E", text: "32%" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "After the first discount, the price is 0.80 of the original. After the second discount, the price is 0.90 * 0.80 = 0.72 of the original. The total discount is 1 - 0.72 = 0.28, or 28%.",
    estimatedTimeSeconds: 75,
  },
  {
    id: "quant-018",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-algebra-2", "q-algebra-3"],
    difficulty: 1.3,
    discrimination: 1.5,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "For how many integer values of k does the equation x\u00b2 + kx + 12 = 0 have two integer solutions?",
      choices: [
        { label: "A", text: "4" },
        { label: "B", text: "6" },
        { label: "C", text: "8" },
        { label: "D", text: "10" },
        { label: "E", text: "12" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "If x\u00b2 + kx + 12 = 0 has integer solutions p and q, then pq = 12 and p + q = -k. Since 12 > 0, both p and q must share the same sign. The factor pairs (both positive) are: (1,12), (2,6), (3,4). The factor pairs (both negative) are: (-1,-12), (-2,-6), (-3,-4). The sums p + q are: 13, 8, 7, -13, -8, -7, giving k = -13, -8, -7, 13, 8, 7. That is 6 distinct values of k.",
    estimatedTimeSeconds: 150,
  },
  {
    id: "quant-019",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-geometry-2"],
    difficulty: 1.1,
    discrimination: 1.4,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A right triangle has legs of length 5 and 12. A circle is inscribed in the triangle. What is the radius of the inscribed circle?",
      choices: [
        { label: "A", text: "1.5" },
        { label: "B", text: "2" },
        { label: "C", text: "2.5" },
        { label: "D", text: "3" },
        { label: "E", text: "3.5" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "The hypotenuse = \u221a(25 + 144) = 13. For a right triangle, the inradius r = (a + b - c) / 2 = (5 + 12 - 13) / 2 = 4 / 2 = 2.",
    estimatedTimeSeconds: 90,
  },
  {
    id: "quant-020",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-statistics-1", "q-word-problems-2"],
    difficulty: 1.4,
    discrimination: 1.6,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "Set S has 5 numbers with a mean of 10 and a standard deviation of 0. Set T has 5 different positive numbers with a mean of 10. Which of the following must be true?",
      choices: [
        { label: "A", text: "The standard deviation of T is greater than 0" },
        { label: "B", text: "The standard deviation of T is 0" },
        { label: "C", text: "The range of T is 0" },
        { label: "D", text: "The median of T equals 10" },
        { label: "E", text: "Every number in T is greater than every number in S" },
      ],
    }),
    correctAnswer: "A",
    explanation:
      "A standard deviation of 0 means all values in S are identical (all equal 10). Set T has 5 different positive numbers, so they cannot all be equal. Since at least one number differs from the mean, the standard deviation of T must be greater than 0.",
    estimatedTimeSeconds: 120,
  },

  // ==========================================================================
  // VERY HARD (5 questions, difficulty 1.5 to 2.5)
  // ==========================================================================
  {
    id: "quant-021",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-arithmetic-2", "q-algebra-3"],
    difficulty: 1.7,
    discrimination: 2.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "How many three-digit positive integers are there such that the product of their digits is 24?",
      choices: [
        { label: "A", text: "18" },
        { label: "B", text: "21" },
        { label: "C", text: "24" },
        { label: "D", text: "27" },
        { label: "E", text: "30" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "We need ordered triples (a, b, c) of digits 1\u20139 with a * b * c = 24. The unordered sets of single-digit factors with product 24 are: {1,3,8}, {1,4,6}, {2,2,6}, {2,3,4}. Counting permutations: {1,3,8} has 3! = 6 arrangements; {1,4,6} has 3! = 6; {2,2,6} has 3!/2! = 3; {2,3,4} has 3! = 6. Total = 6 + 6 + 3 + 6 = 21.",
    estimatedTimeSeconds: 180,
  },
  {
    id: "quant-022",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-algebra-3"],
    difficulty: 2.0,
    discrimination: 2.1,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "If x and y are positive integers and x\u00b2 - y\u00b2 = 45, how many ordered pairs (x, y) satisfy this equation?",
      choices: [
        { label: "A", text: "2" },
        { label: "B", text: "3" },
        { label: "C", text: "4" },
        { label: "D", text: "5" },
        { label: "E", text: "6" },
      ],
    }),
    correctAnswer: "B",
    explanation:
      "Factor: (x - y)(x + y) = 45. Since x, y are positive integers, both factors are positive and x + y > x - y. Both factors must share the same parity; since 45 is odd, both must be odd. The valid factor pairs (d, D) with d < D, d * D = 45, both odd: (1, 45), (3, 15), (5, 9). For each pair, x = (d + D)/2 and y = (D - d)/2. (1, 45): x = 23, y = 22. (3, 15): x = 9, y = 6. (5, 9): x = 7, y = 2. All three give positive integers, so there are 3 ordered pairs.",
    estimatedTimeSeconds: 150,
  },
  {
    id: "quant-023",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-word-problems-2", "q-algebra-3"],
    difficulty: 1.9,
    discrimination: 1.9,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "A committee of 4 people is to be chosen from 5 men and 4 women. If the committee must have at least 2 women, how many different committees are possible?",
      choices: [
        { label: "A", text: "51" },
        { label: "B", text: "60" },
        { label: "C", text: "66" },
        { label: "D", text: "75" },
        { label: "E", text: "81" },
      ],
    }),
    correctAnswer: "E",
    explanation:
      "Count committees by number of women. Exactly 2 women: C(4,2) * C(5,2) = 6 * 10 = 60. Exactly 3 women: C(4,3) * C(5,1) = 4 * 5 = 20. Exactly 4 women: C(4,4) * C(5,0) = 1 * 1 = 1. Total = 60 + 20 + 1 = 81.",
    estimatedTimeSeconds: 120,
  },
  {
    id: "quant-024",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-arithmetic-2", "q-algebra-3"],
    difficulty: 2.3,
    discrimination: 2.2,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "What is the units digit of 7^2026?",
      choices: [
        { label: "A", text: "1" },
        { label: "B", text: "3" },
        { label: "C", text: "7" },
        { label: "D", text: "9" },
        { label: "E", text: "It cannot be determined" },
      ],
    }),
    correctAnswer: "D",
    explanation:
      "The units digits of powers of 7 cycle with period 4: 7^1 = 7, 7^2 = 9, 7^3 = 3, 7^4 = 1, then the pattern repeats. Divide the exponent by 4: 2026 = 4 * 506 + 2, so 2026 mod 4 = 2. The units digit of 7^2026 is the same as the units digit of 7^2, which is 9.",
    estimatedTimeSeconds: 90,
  },
  {
    id: "quant-025",
    section: "quantitative",
    questionType: "problem_solving",
    skillNodeIds: ["q-geometry-2", "q-algebra-3"],
    difficulty: 2.5,
    discrimination: 2.0,
    guessing: 0.2,
    content: JSON.stringify({
      stem: "In the xy-plane, the line y = kx + 5 is tangent to the circle x\u00b2 + y\u00b2 = 9. What is the value of k\u00b2?",
      choices: [
        { label: "A", text: "9/16" },
        { label: "B", text: "4/3" },
        { label: "C", text: "16/9" },
        { label: "D", text: "7/3" },
        { label: "E", text: "3" },
      ],
    }),
    correctAnswer: "C",
    explanation:
      "The circle x\u00b2 + y\u00b2 = 9 has center (0, 0) and radius 3. The line kx - y + 5 = 0 is tangent to the circle when the perpendicular distance from the center equals the radius: |5| / \u221a(k\u00b2 + 1) = 3. So 5 / \u221a(k\u00b2 + 1) = 3, giving \u221a(k\u00b2 + 1) = 5/3. Squaring: k\u00b2 + 1 = 25/9, so k\u00b2 = 25/9 - 9/9 = 16/9.",
    estimatedTimeSeconds: 150,
  },
];
