import { Link } from 'react-router';
import LegalLayout from './LegalLayout.jsx';

function LegalNoticePage() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="16 novembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site Orbea Spacelines est édité par <strong>Léa Santos Franco</strong>, dans le cadre de la préparation
        du titre professionnel Concepteur Développeur d'Applications. Il s'agit d'un projet pédagogique sans activité
        commerciale.
      </p>
      <p>Directrice de la publication : Léa Santos Franco.</p>

      <h2>Hébergement</h2>
      <p>
        Le site est actuellement exécuté en environnement de développement. Les coordonnées de l'hébergeur seront
        indiquées ici lors de la mise en ligne.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, le logo et la charte graphique d'Orbea Spacelines ont été créés pour ce projet. Toute
        reproduction en dehors de ce cadre nécessite l'accord de l'éditrice. Les polices Syne et Manrope sont
        distribuées sous licence libre (SIL Open Font License).
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalLayout>
  );
}

export default LegalNoticePage;
