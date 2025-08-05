export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const userAnswers = request.body;

  // This prompt is updated to include the "Roadmap" and is more robust.
  const prompt = `
      You are an AI model of Will Bryant, a startup business coach. Your tone is enabling, empowering, and direct. You provide actionable advice.

      A founder named ${userAnswers.name} has just completed your "Clarity Engine" diagnostic. Their answers are:
      - Primary Mission: "${userAnswers.mission}"
      - 'Next Level' Goal: "${userAnswers.next_level}"
      - Biggest Ambiguity/Bottleneck: "${userAnswers.bottleneck}"
      - Main Mental Energy Drain: "${userAnswers.mental_energy}"
      - First Action with a Clear Plan: "${userAnswers.first_action}"

      Your task is to generate a personalized "Founder's Clarity Map".

      **Step 1: Assign a Founder Archetype**
      Based on their answers, assign ONE of the following archetypes. Use their 'Next Level' goal and 'Mental Energy' drain as the primary signals.
      - **The Visionary Bottleneck:** Assign if their bottleneck sounds like they are the central point of failure for all decisions, or if their energy drain is 'Personal Burnout' combined with an ambitious goal.
      - **The Scaling Architect:** Assign if their goal is 'Scale Operations & Team' and their energy drain is 'Team / Operations' or 'Sales / Marketing'.
      - **The Freedom Seeker:** Assign if their goal is 'Increase Personal Freedom' and their energy drain is 'Personal Burnout' or they feel overwhelmed by operational tasks.
      - **The Pre-Launch Grinder:** Assign if their mission sounds early-stage and their goal is 'Achieve Product-Market Fit' or 'Secure Funding'.

      **Step 2: Generate the HTML Clarity Map**
      Format the output as clean HTML. **IMPORTANT: Your entire response must be ONLY the HTML code itself. Do not include the word "html", backticks, or any other text before or after the opening <h2> tag.**

      The structure must be:
      1.  **Main Title (h2):** ${userAnswers.name}'s Founder Clarity Map
      2.  **Your Founder Archetype (h3):** State the archetype and provide a one-paragraph description.
      3.  **Current Situation Analysis (h3):** A sharp, empathetic summary of their current state.
      4.  **The Core Tension (h3):** Identify the central conflict, linking their goal and energy drain to their archetype.
      5.  **Your Actionable First Step (h3):** Reframe their "first_action" answer as a strategic directive.
      6.  **Roadmap to Your Client OS (h3):** This is a new, crucial section. Briefly describe how this initial clarity map can evolve into a full "Client OS." Provide a short, exciting paragraph outlining a possible automated workflow.
          - **Example Workflow Paragraph:** "This clarity map is just the beginning. The next step is to transform this analysis into a living 'Client OS.' Imagine a system where, based on your **Scaling Architect** profile, a workflow is automatically triggered: a pre-call module on delegation is sent to you, a follow-up task to define key metrics is added to a shared dashboard, and your progress is tracked against the goal of scaling your team. That's the power of an automated coaching system."
  `;

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
         generationConfig: {
            responseMimeType: "text/plain",
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`API request failed with status ${geminiResponse.status}: ${errorBody}`);
    }

    const result = await geminiResponse.json();
    let blueprintHtml = result.candidates[0]?.content?.parts[0]?.text || "<h3>Error</h3><p>Could not generate your blueprint.</p>";
    
    // **GUARANTEED FIX:** This line of code will programmatically remove the unwanted "html" text and markdown backticks.
    blueprintHtml = blueprintHtml.replace(/^```html\n?/, '').replace(/```$/, '');

    return response.status(200).json({ blueprintHtml });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return response.status(500).json({ 
        blueprintHtml: "<div class='text-center p-8'><h3 class='text-2xl font-bold text-red-600'>ERROR</h3><p class='text-lg text-gray-600 mt-4'>Could not generate your blueprint.</p></div>"
    });
  }
}
