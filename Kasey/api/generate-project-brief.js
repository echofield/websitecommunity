/**
 * API Endpoint: /api/generate-project-brief
 * Génère une simulation de projet web personnalisée pour The Foundry.
 */
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const userAnswers = request.body;

    const prompt = `
      // CONTEXTE
      Vous êtes l'IA de "The Foundry", un hub exclusif pour les développeurs d'élite ("Membres") et les porteurs de projets innovants ("Utilisateurs"). Votre ton est expert, rassurant et visionnaire. Vous ne vous contentez pas de résumer un besoin, vous montrez le potentiel d'une collaboration au sein d'un écosystème performant.

      // DONNÉES DE L'UTILISATEUR
      Un utilisateur nommé ${userAnswers.name} vient de terminer le simulateur. Ses réponses sont :
      - Type de projet: "${userAnswers.project_type}"
      - Objectif N°1: "${userAnswers.main_goal}"
      - Budget: "${userAnswers.budget_range}"

      // VOTRE MISSION
      Générer une "Simulation de Projet" concise et à forte valeur ajoutée, directement en HTML.
      Votre réponse doit être UNIQUEMENT le code HTML, sans aucun autre texte, backtick ou explication.

      // STRUCTURE HTML REQUISE
      1.  **Titre (h2):** Utilisez "Simulation de Projet pour ${userAnswers.name}". Le texte doit être centré.
      2.  **Section 1: Votre Brief de Mission (h3 + ul/li):** Résumez clairement le besoin.
          - "Type de projet : [valeur]"
          - "Objectif principal : [valeur]"
          - "Budget indicatif : [valeur]"
      3.  **Section 2: Profils de Membres Recommandés (h3 + div de cartes):** C'est la simulation de matching. Générez 2 cartes de profils de Membres *fictifs mais réalistes* dans un conteneur flex.
          - **Logique :** Recommandez des profils adaptés au type de projet. Si 'E-commerce', proposez un expert Shopify/WooCommerce. Si 'Application Web', un expert React/Node.js ou No-code. Si 'Site Vitrine', un expert Webflow/WordPress.
          - **Chaque carte doit contenir :** un titre (ex: "Membre Spécialiste Webflow"), une courte description de son rôle, et 3 compétences clés en liste. Le design des cartes doit être simple (bordure, padding, fond légèrement différent).
      4.  **Section 3: Au-delà de la Mission : Notre Écosystème (h3 + p):** C'est la partie visionnaire. Expliquez en 2-3 phrases le modèle du double moteur.
          - **Exemple de texte :** "Chez The Foundry, une mission réussie n'est que le début. C'est le moteur qui alimente notre Labo Produit. En travaillant avec nos Membres, vous bénéficiez non seulement de leur expertise, mais aussi de l'efficacité de leur Arsenal d'outils de pointe, développé en interne. C'est notre vision : un service d'excellence qui finance une innovation continue."
      5.  **Section 4: Prochaines Étapes (h3 + p):** Un appel à l'action clair.
          - **Texte :** "Cette simulation a été enregistrée. The Foundry est actuellement en lancement privé. Un membre de notre équipe vous contactera prochainement pour discuter de la manière dont nous pouvons transformer ce brief en réalité."
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
