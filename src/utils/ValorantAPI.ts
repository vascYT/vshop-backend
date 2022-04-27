import { fetch } from "./misc";
import { VCurrencies } from "./misc";

export default class ValorantAPI {
  public userId = "";
  public region = "";

  private accessToken = "";
  private entitlementsToken = "";

  constructor(
    accessToken: string,
    entitlementsToken: string,
    region: string,
    userId: string
  ) {
    this.accessToken = accessToken;
    this.entitlementsToken = entitlementsToken;
    this.region = region;
    this.userId = userId;
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

    /* SHOP */
    let offers: { [offerId: string]: number } = {};
    for (var i = 0; i < res2.body.Offers.length; i++) {
      const offer = res2.body.Offers[i];
      offers[offer.OfferID] = offer.Cost[VCurrencies.VP];
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

    /* BUNDLE */
    let bundle: Bundle = (
      await fetch(
        `https://valorant-api.com/v1/bundles/${res.body.FeaturedBundle.Bundle.DataAssetID}`,
        {
          method: "GET",
        }
      )
    ).body.data;

    bundle.price = res.body.FeaturedBundle.Bundle.Items.map(
      (item: any) => item.DiscountedPrice
    ).reduce((a: any, b: any) => a + b);

    /* NIGHT MARKET */
    const bonusStore = res.body.BonusStore
      ? res.body.BonusStore.BonusStoreOffers
      : [];

    let nightMarket = [];
    for (var i = 0; i < bonusStore.length; i++) {
      let itemid = bonusStore[i].Offer.Rewards[0].ItemID;
      nightMarket[i] = (
        await fetch(
          `https://valorant-api.com/v1/weapons/skinlevels/${itemid}`,
          {
            method: "GET",
          }
        )
      ).body.data;
      nightMarket[i].price = bonusStore[i].Offer.Cost[VCurrencies.VP];
      nightMarket[i].discountPrice =
        bonusStore[i].DiscountCosts[VCurrencies.VP];
      nightMarket[i].discountPercent = bonusStore[i].DiscountPercent;
    }

    return { shop, bundle, nightMarket };
  }

  public async getWallet() {
    const res = await fetch(this.getUrl("wallet"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Entitlements-JWT": this.entitlementsToken,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    return {
      vp: res.body.Balances[VCurrencies.VP],
      rad: res.body.Balances[VCurrencies.RAD],
      fag: res.body.Balances[VCurrencies.FAG],
    };
  }

  public async getProgress() {
    const res = await fetch(this.getUrl("playerxp"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Entitlements-JWT": this.entitlementsToken,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    return {
      level: res.body.Progress.Level,
      xp: res.body.Progress.XP,
    };
  }

  private getUrl(name: string) {
    const URLS: any = {
      auth: "https://auth.riotgames.com/api/v1/authorization/",
      entitlements: "https://entitlements.auth.riotgames.com/api/token/v1/",
      userinfo: "https://auth.riotgames.com/userinfo/",
      storefront: `https://pd.${this.region}.a.pvp.net/store/v2/storefront/${this.userId}`,
      wallet: `https://pd.${this.region}.a.pvp.net/store/v1/wallet/${this.userId}`,
      playerxp: `https://pd.${this.region}.a.pvp.net/account-xp/v1/players/${this.userId}`,
      weapons: "https://valorant-api.com/v1/weapons/",
      offers: `https://pd.${this.region}.a.pvp.net/store/v1/offers/`,
      playerId: `https://pd.${this.region}.a.pvp.net/name-service/v2/players/`,
    };

    return URLS[name];
  }
}
