/**
 * Service de calcul de distance géographique
 * Utilise la formule de Haversine pour calculer la distance entre deux points (lat, lon)
 */
export class DistanceCalculatorService {
    /**
     * Calcule la distance en kilomètres entre deux points géographiques
     * @param from Point de départ (lat, lon)
     * @param to Point d'arrivée (lat, lon)
     * @returns Distance en kilomètres
     */
    static calculateDistance(from, to) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.toRad(to.latitude - from.latitude);
        const dLon = this.toRad(to.longitude - from.longitude);
        const lat1 = this.toRad(from.latitude);
        const lat2 = this.toRad(to.latitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    /**
     * Convertit les degrés en radians
     */
    static toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    /**
     * Trouve le point le plus proche parmi une liste
     * @param from Point de référence
     * @param candidates Candidats à évaluer
     * @returns Le candidat le plus proche avec sa distance
     */
    static findClosest(from, candidates) {
        if (candidates.length === 0)
            return null;
        let closest = candidates[0];
        let minDistance = this.calculateDistance(from, closest.coordinates);
        for (let i = 1; i < candidates.length; i++) {
            const distance = this.calculateDistance(from, candidates[i].coordinates);
            if (distance < minDistance) {
                minDistance = distance;
                closest = candidates[i];
            }
        }
        return { item: closest, distance: minDistance };
    }
    /**
     * Trie une liste de points par distance croissante
     */
    static sortByDistance(from, items) {
        return items
            .map(item => ({
            ...item,
            distance: this.calculateDistance(from, item.coordinates),
        }))
            .sort((a, b) => a.distance - b.distance);
    }
}
