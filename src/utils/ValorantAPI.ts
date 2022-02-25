import { fetch } from "./misc";
import { ValorantIds } from "./misc";

export default class ValorantAPI {
  public username = "";
  public userId = "";
  public region = "";

  private accessToken = "";
  private entitlementsToken = "";

  constructor(accessToken: string, entitlementsToken: string, region: string) {
    this.accessToken = accessToken;
    this.entitlementsToken = entitlementsToken;
    this.region = region;
  }

  public async init() {
    let res1 = await fetch(this.getUrl("userinfo"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.userId = res1.body.sub;
  }

  public async getShop() {
    const res = await fetch(this.getUrl("storefront"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Entitlements-JWT": this.entitlementsToken,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    const res2 = await fetch(this.getUrl("offers"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Entitlements-JWT": this.entitlementsToken,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    let offers: { [offerId: string]: number } = {};
    for (var i = 0; i < res2.body.Offers.length; i++) {
      const offer = res2.body.Offers[i];
      offers[offer.OfferID] = offer.Cost[ValorantIds.VP];
    }

    let singleItemOffers = res.body.SkinsPanelLayout.SingleItemOffers;
    let shop: singleItem[] = [];
    for (var i = 0; i < singleItemOffers.length; i++) {
      shop[i] = (
        await fetch(
          `https://valorant-api.com/v1/weapons/skinlevels/${singleItemOffers[i]}`,
          {
            method: "GET",
          }
        )
      ).body.data;
      shop[i].price = offers[shop[i].uuid];
    }

    return shop;
  }

  public async getNightMarket() {
    const shop = await fetch(this.getUrl("storefront"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Entitlements-JWT": this.entitlementsToken,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    var nightShop = shop.body.BonusStore.BonusStoreOffers;
    if (!nightShop) return []; // Hopefully this works, bc idk what the api returns if there is no night shop

    var arr = [];
    for (var i = 0; i < nightShop.length; i++) {
      let itemid = nightShop[i].Offer.Rewards[0].ItemID;
      arr[i] = (
        await fetch(
          `https://valorant-api.com/v1/weapons/skinlevels/${itemid}`,
          {
            method: "GET",
          }
        )
      ).body.data;
      arr[i].price = nightShop[i].Offer.Cost[ValorantIds.VP];
      arr[i].discountPrice = nightShop[i].DiscountCosts[ValorantIds.VP];
      arr[i].discountPercent = nightShop[i].DiscountPercent;
    }

    return arr as singleNightMarketItem[];
  }

  public async getBundle() {
    const shop = await fetch(this.getUrl("storefront"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Entitlements-JWT": this.entitlementsToken,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    let bundle: Bundle = (
      await fetch(
        `https://valorant-api.com/v1/bundles/${shop.body.FeaturedBundle.Bundle.DataAssetID}`,
        {
          method: "GET",
        }
      )
    ).body;

    bundle.price = shop.body.FeaturedBundle.Bundle.Items.map(
      (item: any) => item.DiscountedPrice
    ).reduce((a: any, b: any) => a + b);

    return bundle;
  }

  private getUrl(name: string) {
    const URLS: any = {
      auth: "https://auth.riotgames.com/api/v1/authorization/",
      entitlements: "https://entitlements.auth.riotgames.com/api/token/v1/",
      userinfo: "https://auth.riotgames.com/userinfo/",
      storefront: `https://pd.${this.region}.a.pvp.net/store/v2/storefront/${this.userId}`,
      wallet: `https://pd.${this.region}.a.pvp.net/store/v1/wallet/${this.userId}`,
      weapons: "https://valorant-api.com/v1/weapons/",
      offers: `https://pd.${this.region}.a.pvp.net/store/v1/offers/`,
      playerId: `https://pd.${this.region}.a.pvp.net/name-service/v2/players/`,
    };

    return URLS[name];
  }
}
