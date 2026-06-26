interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface BigDataCloudResponse {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
}

function formatNominatimAddress(data: NominatimResponse): string | null {
  const addr = data.address;
  if (!addr && data.display_name) return data.display_name;

  if (addr) {
    const street = [addr.road, addr.house_number].filter(Boolean).join(' ');
    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      '';
    const region = addr.state || addr.county || '';
    const parts = [street, locality, region, addr.country].filter(Boolean);

    if (parts.length > 0) return parts.join(', ');
  }

  return data.display_name?.trim() || null;
}

function formatBigDataCloudAddress(data: BigDataCloudResponse): string | null {
  const locality = data.locality || data.city || '';
  const parts = [locality, data.principalSubdivision, data.countryName].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

async function reverseGeocodeNominatim(latitude: number, longitude: number): Promise<string | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
    {
      headers: {
        'User-Agent': 'MemoraBook/1.0 (memora-book-app)',
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as NominatimResponse;
  return formatNominatimAddress(data);
}

async function reverseGeocodeBigDataCloud(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`,
  );

  if (!response.ok) return null;

  const data = (await response.json()) as BigDataCloudResponse;
  return formatBigDataCloudAddress(data);
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const nominatim = await reverseGeocodeNominatim(latitude, longitude);
    if (nominatim) return nominatim;
  } catch {
    // try fallback
  }

  try {
    const bigDataCloud = await reverseGeocodeBigDataCloud(latitude, longitude);
    if (bigDataCloud) return bigDataCloud;
  } catch {
    // no address available
  }

  throw new Error('No se pudo obtener la dirección');
}
