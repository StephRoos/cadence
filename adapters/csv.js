/**
 * Adapter CSV → JSON pour Cadence
 * Utilise Papa Parse (à charger via CDN ou npm)
 *
 * Usage navigateur :
 *   const data = await cadenceFromCSV(file, { yearColumn: 'year', valueColumn: 'value' })
 *
 * Retourne un tableau d'objets prêt à être consommé par un canevas.
 */

async function cadenceFromCSV(source, options = {}) {
  // source peut être un File, une URL, ou une string CSV
  let csvText

  if (source instanceof File) {
    csvText = await source.text()
  } else if (source.startsWith('http')) {
    const res = await fetch(source)
    csvText = await res.text()
  } else {
    csvText = source  // string brute
  }

  // Papa Parse doit être chargé globalement
  if (typeof Papa === 'undefined') {
    throw new Error('Papa Parse non chargé — ajouter <script src="https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js">')
  }

  const parsed = Papa.parse(csvText, {
    header: true,       // première ligne = noms de colonnes
    dynamicTyping: true, // convertit les nombres automatiquement
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    console.warn('CSV parsing warnings:', parsed.errors)
  }

  return parsed.data
}
