/**
 * API Endpoint: /api/generate-project-brief
 * Génère une simulation de projet web personnalisée pour The Foundry.
 * VERSION 2.1 : Prompt renforcé pour éviter les retours de code Markdown.
 */
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const userAnswers = request.body;

    const prompt = `
      // CONTEXTE
      Vous êtes l'IA de "The Foundry", un hub exclusif pour les développeurs d'élite ("Membres") et les porteurs de projets innovants ("Utilisateurs"). Votre ton est expert, rassurant et visionnaire.

      // DONNÉES DE L'UTILISATEUR
      Un utilisateur nommé ${userAnswers.name} vient de terminer le simulateur. Ses réponses sont :
      - Type de projet: "${userAnswers.project_type}"
      - Objectif N°1: "${userAnswers.main_goal}"
      - Budget: "${userAnswers.budget_range}"

      // VOTRE MISSION
      Générer une "Simulation de Projet" en deux visions claires, directement en HTML.
      
      // STRUCTURE HTML REQUISE
      // ... (Toute la structure que nous avons définie précédemment reste ici) ...
      <h2 style="text-align: center; font-weight: 700; font-size: 1.8rem; margin-bottom: 2rem;">Simulation de Projet pour ${userAnswers.name}</h2>
      <h3>Vision 1 : Votre Projet, Concrétisé</h3>
      <p style="color: var(--muted); margin-top: 0.5rem; margin-bottom: 1.5rem;">Ceci est la synthèse de votre demande. Nous avons écouté attentivement votre besoin initial.</p>
      ... etc ...
      <hr style="margin: 2rem 0;">
      <h3>Vision 2 : Votre Projet, Augmenté</h3>
      ... etc ...
      <hr style="margin: 2rem 0;">
      <h3>Prochaines Étapes</h3>
      <p>Cette simulation a été enregistrée. The Foundry est actuellement en lancement privé. Un membre de notre équipe vous contactera prochainement pour discuter de la manière dont nous pouvons transformer ce brief en réalité, et explorer tout son potentiel.</p>

      // RÈGLE ABSOLUE
      IMPORTANT : Votre réponse doit commencer IMPÉRATIVEMENT par la balise <h2> et se terminer par la dernière balise </p>. N'incluez AUCUN autre texte, JAMAIS de backticks \`\`\`, et pas le mot 'html' avant ou après le code.
    `;

    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            throw new Error("GEMINI_API_KEY is not defined.");
        }

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "text/plain",
                    temperature: 0.6,
                }
            }),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            throw new Error(`API request failed with status ${geminiResponse.status}: ${errorBody}`);
        }

        const result = await geminiResponse.json();
        const briefHtml = result.candidates?.[0]?.content?.parts?.[0]?.text || "<h3>Erreur</h3><p>Le contenu n'a pas pu être généré.</p>";
        
        return response.status(200).json({ briefHtml });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return response.status(500).json({ 
            briefHtml: "<div class='text-center p-8'><h3 class='text-2xl font-bold text-red-600'>Erreur Serveur</h3><p class='text-lg text-gray-600 mt-4'>Nous avons rencontré un problème en générant votre simulation.</p></div>"
        });
    }
}
