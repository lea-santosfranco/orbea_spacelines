import LegalLayout from './LegalLayout.jsx';

function TermsPage() {
  return (
    <LegalLayout title="Conditions générales de vente" updatedAt="16 novembre 2026">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions encadrent les ventes de voyages spatiaux et d'articles souvenirs (goodies) sur le
        site Orbea Spacelines. Toute commande implique leur acceptation.
      </p>

      <h2>2. Produits</h2>
      <p>
        Chaque voyage est proposé à des dates de départ et dans des classes (Économie, Affaires, Première) dont le
        nombre de places est limité. Les goodies sont proposés dans la limite des stocks disponibles. Un départ
        complet ou un article épuisé ne peut pas être commandé.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises. Le prix appliqué est celui affiché au moment de la
        validation de la commande ; il reste inchangé pour cette commande même si le tarif évolue ensuite.
      </p>

      <h2>4. Commande</h2>
      <p>
        Le panier est accessible sans compte. Un compte client est en revanche nécessaire pour valider une commande.
        La disponibilité des places et du stock est vérifiée juste avant le paiement.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement s'effectue par carte bancaire via la plateforme sécurisée Stripe. La commande est confirmée une
        fois le paiement accepté. Sur ce site de démonstration, seul le mode test de Stripe est utilisé.
      </p>

      <h2>6. Livraison</h2>
      <p>
        Les goodies sont expédiés à l'adresse indiquée lors de la commande. Les voyages ne font pas l'objet d'une
        livraison : le récapitulatif de la réservation est disponible dans l'espace client.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Pour les goodies, vous disposez de 14 jours à compter de la réception pour vous rétracter. Conformément à
        l'article L221-28 du Code de la consommation, ce droit ne s'applique pas aux prestations de transport et de
        loisirs fournies à une date déterminée, comme les voyages.
      </p>

      <h2>8. Annulation</h2>
      <p>
        Une commande peut être annulée par l'agence tant qu'elle n'est pas terminée. Le cas échéant, le montant payé
        est intégralement remboursé.
      </p>

      <h2>9. Litiges</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera
        recherchée avant toute action en justice.
      </p>
    </LegalLayout>
  );
}

export default TermsPage;
