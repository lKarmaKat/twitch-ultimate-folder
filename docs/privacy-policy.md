# Politique de confidentialité — Ultimate Twitch Folders

Dernière mise à jour : 07/10/2026

## Données collectées

Ultimate Twitch Folders utilise l'API Twitch (OAuth) pour accéder à la liste
de vos chaînes suivies. Dans ce cadre, les données suivantes sont stockées
localement, dans le stockage de votre navigateur (`chrome.storage.local`) :

- votre identifiant utilisateur Twitch
- votre token d'accès et token de rafraîchissement OAuth Twitch
- la liste de vos chaînes suivies et leur statut (cache technique)
- la configuration de vos dossiers personnalisés

## Utilisation des données

Ces données sont utilisées exclusivement pour faire fonctionner l'extension
(afficher vos chaînes suivies organisées en dossiers). Elles ne sont jamais
transmises à un serveur tiers ou à l'auteur de l'extension : le seul service
externe contacté pour les utiliser est l'API officielle de Twitch
(twitch.tv / id.twitch.tv), directement depuis votre navigateur. La seule
autre connexion est l'envoi de statistiques anonymes décrit ci-dessous, qui
ne contient aucune de ces données.

## Statistiques d'utilisation anonymes (Chrome uniquement)

La version Chrome de l'extension, installée depuis le Chrome Web Store (y
compris sur Edge), envoie au plus une fois par semaine un résumé anonyme de
l'organisation de vos listes. Il permet à l'auteur de savoir quelles
fonctionnalités sont réellement utilisées. La version Firefox n'envoie rien.

Ce résumé contient :

- la version de l'extension
- le mois d'installation de l'extension, ou l'indication qu'elle était
  installée avant l'apparition de ces statistiques
- le nombre de configurations enregistrées pour chaque compte Twitch utilisé
  dans le navigateur
- pour chaque liste de la configuration en cours : sa disposition, son tri,
  sa source (manuelle, par jeu, par langue, chaînes récentes), son niveau
  d'imbrication, le nombre de chaînes et de sous-listes qu'elle contient, et
  si elle contient l'élément « Toutes les autres chaînes »

Ce résumé ne contient jamais votre identifiant ou votre nom Twitch, vos
tokens, les chaînes que vous suivez ou que vous avez rangées, les noms de vos
listes, ni aucun identifiant d'installation. Rien ne permet de relier deux
envois entre eux ni de les rattacher à une personne. Pour respecter le rythme
d'une semaine, l'extension conserve localement la date de son installation et
celle du dernier envoi.

Le résumé est envoyé à un serveur hébergé chez Cloudflare (Workers et D1) et
exploité par l'auteur de l'extension. Comme toute requête sur Internet, l'envoi
passe par votre adresse IP, mais le serveur ne l'enregistre pas. Les résumés
sont conservés 25 mois au plus, puis supprimés automatiquement.

Pour ne plus rien envoyer, désactivez « Statistiques d'utilisation anonymes »
dans le panneau qui s'ouvre en cliquant sur l'icône de l'extension. Aucun
résumé n'étant rattaché à vous, ceux déjà reçus ne peuvent pas être retrouvés
pour être supprimés : ils disparaissent à la fin du délai de conservation.

## Partage des données

Aucune donnée n'est vendue, louée ou partagée avec des tiers. Cloudflare se
contente d'héberger les statistiques anonymes pour le compte de l'auteur.

## Conservation et suppression

Les données sont conservées dans le stockage local de votre navigateur tant
que l'extension est installée. La désinstallation de l'extension, ou la
révocation de l'autorisation depuis https://www.twitch.tv/settings/connections,
supprime l'accès et les données stockées.
