import LegalLayout from './LegalLayout.jsx';

function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="16 novembre 2026">
      <h2>Responsable du traitement</h2>
      <p>
        Les données collectées sur Orbea Spacelines sont traitées par Léa Santos Franco, éditrice du site, dans le
        respect du Règlement général sur la protection des données (RGPD).
      </p>

      <h2>Données collectées</h2>
      <p>Nous ne collectons que les données nécessaires au fonctionnement du site :</p>
      <ul>
        <li>
          <strong>Compte client</strong> : nom, prénom, adresse e-mail, mot de passe (enregistré uniquement sous forme hachée
          et jamais lisible), date de votre consentement.
        </li>
        <li>
          <strong>Commandes</strong> : articles achetés, montants, adresse de livraison pour les goodies.
        </li>
        <li>
          <strong>Paiement</strong> : il est entièrement géré par notre prestataire Stripe. Aucune donnée bancaire
          n'est enregistrée sur nos serveurs.
        </li>
      </ul>

      <h2>Pourquoi ces données</h2>
      <ul>
        <li>Gérer votre compte et votre panier (exécution du contrat).</li>
        <li>Traiter vos commandes et vos paiements (exécution du contrat).</li>
        <li>Conserver les factures et l'historique des ventes (obligation légale comptable).</li>
      </ul>
      <p>Vos données ne sont ni vendues, ni utilisées à des fins publicitaires.</p>

      <h2>Durée de conservation</h2>
      <ul>
        <li>Compte client : tant que le compte est actif, puis suppression ou anonymisation.</li>
        <li>
          Commandes : 10 ans, comme l'impose le Code de commerce. En cas de suppression de votre compte, elles sont
          conservées sous forme anonymisée.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        Le site utilise uniquement des cookies indispensables à son fonctionnement : le cookie de session qui vous
        garde connecté et celui qui mémorise votre panier. Aucun cookie publicitaire ou de mesure d'audience n'est
        déposé, c'est pourquoi aucun bandeau de consentement n'est affiché. Les polices de caractères sont
        hébergées sur nos serveurs : aucune donnée n'est transmise à un service tiers lors de leur chargement.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Depuis
        votre espace client, vous pouvez modifier vos informations, télécharger vos données et supprimer votre
        compte. Vous pouvez aussi introduire une réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
          cnil.fr
        </a>
        ).
      </p>
    </LegalLayout>
  );
}

export default PrivacyPage;
