interface user {
  name: string;
  loading: boolean;
  accessToken: string;
  entitlementsToken: string;
  idtoken: string;
  expiresIn: number;
  region: string;
  id: string;
  error?: string | undefined;
  mfaRequired?: boolean | undefined;
  mfaEmail?: string | undefined;
}

interface singleItem {
  uuid: string;
  displayName: string;
  displayIcon: string;
  streamedVideo: string;
  assetPath: string;
  price: number;
}

interface singleNightMarketItem extends singleItem {
  discountPrice: number;
  discountPercent: number;
}

interface Bundle {
  uuid: string;
  displayName: string;
  description: string;
  extraDescription: any;
  promoDescription: any;
  useAdditionalContext: boolean;
  displayIcon: string;
  displayIcon2: string;
  verticalPromoImage: string;
  assetPath: string;
  price: number;
}
