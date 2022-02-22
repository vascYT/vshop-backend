import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

export default class ValorantAPI {
  public offers: any;
  public username = "";
  private userId = "";
  public password = "";
  public region = "";
  private accessToken = "";
  private entitlementsToken = "";
  private idtoken = "";
  private expiresIn = "";
  private cookieJar = new CookieJar();

  constructor(username: string, password: string, region: string) {
    wrapper(axios);
    this.username = username;
    this.password = password;
    this.region = region;
  }

  public async login() {
    await axios({
      url: this.getUrl("auth"),
      method: "POST",
      data: {
        client_id: "play-valorant-web-prod",
        nonce: "1",
        redirect_uri: "https://playvalorant.com/opt_in",
        response_type: "token id_token",
      },
      headers: {
        "Content-Type": "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
      },
      withCredentials: true,
      jar: this.cookieJar,
    });

    /* LOG IN */
    let response: any = (
      await axios({
        url: this.getUrl("auth"),
        method: "PUT",
        data: {
          type: "auth",
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
        jar: this.cookieJar,
      }).catch(() => {
        return {
          data: {
            error: "rate_limited",
          },
        };
      })
    ).data;

    if (response.error === "auth_failure")
      return {
        error: "An auth error occurred, are the given credentials valid?",
      };
    else if (response.error === "rate_limited")
      return { error: "You have been rate limited, please try again later." };
    else if (response.type === "multifactor") {
      return { mfaRequired: true, mfaEmail: response.multifactor.email };
    } else if (response.type === "response") {
      await this.createUser(response);
      return { success: true };
    } else {
      return { error: "Oops, an unkown error occoured." };
    }
  }

  public async submitMfaCode(code: string) {
    let response: any = (
      await axios({
        url: this.getUrl("auth"),
        method: "PUT",
        data: {
          type: "multifactor",
          code: code,
          rememberDevice: false,
        },
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })
    ).data;

    if (response.type === "response") {
      return await this.createUser(response);
    } else if (response.error === "multifactor_attempt_failed") {
      return { error: "The MFA code is invalid." };
    } else {
      return { error: "Oops, an unkown error occoured." };
    }
  }

  private async createUser(response: any) {
    const uri = response["response"]["parameters"]["uri"];

    const regexResult = uri.match(
      /access_token=((?:[a-zA-Z]|\d|\.|-|_)*).*id_token=((?:[a-zA-Z]|\d|\.|-|_)*).*expires_in=(\d*)/
    );
    const accessToken = regexResult[1];
    const idtoken = regexResult[2];
    const expiresIn = regexResult[3];

    /* Entitlements */
    const entitlementsToken = (
      (
        await axios({
          url: this.getUrl("entitlements"),
          method: "POST",
          data: {},
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        })
      ).data as any
    ).entitlements_token;

    /* UserId */
    const userId = (
      (
        await axios({
          url: this.getUrl("userinfo"),
          method: "POST",
          data: {},
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        })
      ).data as any
    ).sub;

    this.accessToken = accessToken;
    this.entitlementsToken = entitlementsToken;
    this.idtoken = idtoken;
    this.expiresIn = expiresIn;
    this.userId = userId;

    await this.initOffers();
  }

  private async initOffers() {
    let response: any = (
      await axios({
        url: this.getUrl("offers"),
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Riot-Entitlements-JWT": this.entitlementsToken,
          Authorization: `Bearer ${this.accessToken}`,
        },
        withCredentials: true,
      })
    ).data;

    for (var i = 0; i < response.Offers.length; i++) {
      let offer = response.Offers[i];
      this.offers[offer.OfferID] =
        offer.Cost["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"];
    }
  }

  private getUrl(name: string) {
    const URLS: any = {
      auth: "https://auth.riotgames.com/api/v1/authorization",
      entitlements: "https://entitlements.auth.riotgames.com/api/token/v1",
      userinfo: "https://auth.riotgames.com/userinfo",
      storefront: `https://pd.${this.region}.a.pvp.net/store/v2/storefront/${this.userId}`,
      wallet: `https://pd.${this.region}.a.pvp.net/store/v1/wallet/${this.userId}`,
      weapons: "https://valorant-api.com/v1/weapons",
      offers: `https://pd.${this.region}.a.pvp.net/store/v1/offers`,
      playerId: `https://pd.${this.region}.a.pvp.net/name-service/v2/players`,
    };

    return URLS[name];
  }

  public async getMarket() {
    const shop: any = (
      await axios({
        url: this.getUrl("storefront"),
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Riot-Entitlements-JWT": this.entitlementsToken,
          Authorization: `Bearer ${this.accessToken}`,
        },
        withCredentials: true,
      })
    ).data;

    var singleItems = shop.SkinsPanelLayout.SingleItemOffers;

    for (var i = 0; i < singleItems.length; i++) {
      singleItems[i] = (
        (
          await axios({
            url: `https://valorant-api.com/v1/weapons/skinlevels/${singleItems[i]}`,
            method: "GET",
          })
        ).data as any
      ).data;
      singleItems[i].price = this.offers[singleItems[i].uuid];
    }

    return singleItems as singleItem[];
  }

  public async getNightMarket() {
    const shop: any = (
      await axios({
        url: this.getUrl("storefront"),
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Riot-Entitlements-JWT": this.entitlementsToken,
          Authorization: `Bearer ${this.accessToken}`,
        },
        withCredentials: true,
      })
    ).data;

    var nightShop = shop.BonusStore.BonusStoreOffers;
    if (!nightShop) return []; // Hopefully this works, bc idk what the api returns if there is no night shop

    var arr = [];
    for (var i = 0; i < nightShop.length; i++) {
      let itemid = nightShop[i].Offer.Rewards[0].ItemID;
      arr[i] = (
        (
          await axios({
            url: `https://valorant-api.com/v1/weapons/skinlevels/${itemid}`,
            method: "GET",
          })
        ).data as any
      ).data;
      arr[i].price =
        nightShop[i].Offer.Cost["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"];
      arr[i].discountPrice =
        nightShop[i].DiscountCosts["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"];
      arr[i].discountPercent = nightShop[i].DiscountPercent;
    }

    return arr as singleNightMarketItem[];
  }

  public async getBundle() {
    const shop: any = (
      await axios({
        url: this.getUrl("storefront"),
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Riot-Entitlements-JWT": this.entitlementsToken,
          Authorization: `Bearer ${this.accessToken}`,
        },
        withCredentials: true,
      })
    ).data;

    let bundle: Bundle = (
      (
        await axios({
          url: `https://valorant-api.com/v1/bundles/${shop.FeaturedBundle.Bundle.DataAssetID}`,
          method: "GET",
        })
      ).data as any
    ).data;

    bundle.price = shop.FeaturedBundle.Bundle.Items.map(
      (item: any) => item.DiscountedPrice
    ).reduce((a: any, b: any) => a + b);

    return bundle;
  }
}
