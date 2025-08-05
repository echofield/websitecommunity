/**
 * API Endpoint: /api/generate-project-brief
 * Génère une simulation de projet web personnalisée pour The Foundry.
 * VERSION AMÉLIORÉE : Intègre une "double vision" pour montrer le brief de l'utilisateur
 * ET le potentiel débloqué par l'écosystème The Foundry.
 */
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const userAnswers = request.body;

    // --- PROMPT AMÉLIORÉ AVEC LA DOUBLE VISION ---
    const prompt = `
      // CONTEXTE
      Vous êtes l'IA de "The Foundry", un hub exclusif pour les développeurs d'élite ("Membres") et les porteurs de projets innovants ("Utilisateurs"). Votre ton est expert, rassurant et visionnaire. Vous ne vous contentez pas de résumer un besoin, vous montrez le potentiel d'une collaboration au sein d'un écosystème performant.

      // DONNÉES DE L'UTILISATEUR
      Un utilisateur nommé ${userAnswers.name} vient de terminer le simulateur. Ses réponses sont :
      - Type de projet: "${userAnswers.project_type}"
      - Objectif N°1: "${userAnswers.main_goal}"
      - Budget: "${userAnswers.budget_range}"

      // VOTRE MISSION
      Générer une "Simulation de Projet" en deux visions claires, directement en HTML.
      Votre réponse doit être UNIQUEMENT le code HTML, sans aucun autre texte, backtick ou explication.

      // STRUCTURE HTML REQUISE

      // TITRE
      <h2 style="text-align: center; font-weight: 700; font-size: 1.8rem; margin-bottom: 2rem;">Simulation de Projet pour ${userAnswers.name}</h2>

      // --- VISION 1 : LE BRIEF DE L'UTILISATEUR ---
      <h3>Vision 1 : Votre Projet, Concrétisé</h3>
      <p style="color: var(--muted); margin-top: 0.5rem; margin-bottom: 1.5rem;">Ceci est la synthèse de votre demande. Nous avons écouté attentivement votre besoin initial.</p>
      <ul style="list-style-position: inside; margin-bottom: 1.5rem;">
          <li><strong>Type de projet :</strong> ${userAnswers.project_type}</li>
          <li><strong>Objectif principal :</strong> ${userAnswers.main_goal}</li>
          <li><strong>Budget indicatif :</strong> ${userAnswers.budget_range}</li>
      </ul>
      <h4>Profils de Membres Recommandés :</h4>
      <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background-color: #fdfdfd;">
              <h5 style="font-weight: 600;">Membre Spécialiste Webflow</h5>
              <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 0.5rem;">Idéal pour créer des sites vitrines au design exceptionnel avec des animations fluides.</p>
              <ul style="font-size: 0.9rem; list-style-position: inside; padding-left: 0.5rem;"><li>Design sur-mesure</li><li>Optimisation SEO</li><li>Intégrations CMS</li></ul>
          </div>
          <div style="flex: 1; min-width: 250px; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background-color: #fdfdfd;">
              <h5 style="font-weight: 600;">Membre Expert WordPress</h5>
              <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 0.5rem;">Parfait pour un projet évolutif nécessitant un blog puissant ou des fonctionnalités spécifiques.</p>
              <ul style="font-size: 0.9rem; list-style-position: inside; padding-left: 0.5rem;"><li>Thèmes personnalisés</li><li>Développement de plugins</li><li>Maintenance sécurisée</li></ul>
          </div>
      </div>

      <hr style="margin: 2rem 0;">

      // --- VISION 2 : LE POTENTIEL DÉBLOQUÉ ---
      <h3>Vision 2 : Votre Projet, Augmenté</h3>
      <p style="color: var(--muted); margin-top: 0.5rem; margin-bottom: 1.5rem;">Chez The Foundry, nous allons plus loin. Voici des pistes que nos Membres pourraient explorer avec vous pour décupler l'impact de votre projet.</p>
      <div style="border-left: 3px solid var(--accent); padding-left: 1.5rem; margin-top: 1rem;">
          <h5 style="font-weight: 600;">Piste d'Automatisation :</h5>
          <p>Pour votre objectif de "${userAnswers.main_goal}", une fois le projet livré, nous pourrions mettre en place une automatisation qui connecte votre site à vos outils métier (CRM, outil de facturation...). Chaque nouvelle interaction devient une donnée exploitable, sans effort manuel. C'est le genre de gain de productivité que notre écosystème vise.</p>
      </div>

      <hr style="margin: 2rem 0;">

      // --- CONCLUSION ---
      <h3>Prochaines Étapes</h3>
      <p>Cette simulation a été enregistrée. The Foundry est actuellement en lancement privé. Un membre de notre équipe vous contactera prochainement pour discuter de la manière dont nous pouvons transformer ce brief en réalité, et explorer tout son potentiel.</p>
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
