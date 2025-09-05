<route lang="json5" type="page">
{
  style: {
    navigationStyle: "custom",
    navigationBarTitleText: "",
    disableScroll: true, // 微信禁止页面滚动
    "app-plus": {
      bounce: "none", // 禁用 iOS 弹性效果
    },
  },
}
</route>

<template>
  <PageLayout :navbarShow="true">
    <view class="page-container">
      <view class="text-center">
        <view class="logo-bg">
          <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
        </view>
        <!--view class="title text-shadow">{{ compTitle || 'JEECG BOOT' }}</view-->
        <view class="enter-area">
          <view v-if="loginWay == 1" class="account-login-area">
            <view class="box account">
              <!--wd-icon name="user" size="15px"></wd-icon-->
              <!--wd-text text="账号："></wd-text-->
              <wd-input
                prefix-icon="user"
                placeholder="请输入账号"
                v-model.trim="userName"
              ></wd-input>
            </view>
            <view class="box password">
              <wd-input
                class="uni-input"
                prefix-icon="lock-on"
                v-model.trim="password"
                clearable
                show-password
                @change="handleChange"
              />
            </view>
          </view>
          <view v-else class="phone-login-area">
            <view class="account-login-area">
              <view class="box account">
                <wd-icon name="mobile" size="15px"></wd-icon>
                <wd-text text="手机号：" color="#000"></wd-text>
                <wd-input
                  placeholder="请输入手机号"
                  v-model="phoneNo"
                ></wd-input>
              </view>
              <view class="box password">
                <wd-icon name="lock-on" size="15px"></wd-icon>
                <wd-text text="验证码：" color="#000"></wd-text>
                <wd-input
                  placeholder="请输入验证码"
                  v-model="smsCode"
                ></wd-input>
                <wd-button
                  :round="false"
                  size="small"
                  custom-class="sendSMSBtn"
                  plain
                  hairline
                  :disabled="isSendSMSEnable"
                  @click="handleSMSSend"
                >
                  {{ getSendBtnText }}
                </wd-button>
              </view>
            </view>
          </view>
        </view>
        <view class="btn-area text-center">
          <wd-button
            custom-class="login align-top"
            :loading="loading"
            @click="hanldeLogin"
          >
            {{ loading ? "登录中..." : "点击登录" }}
          </wd-button>
          <wd-button
            v-if="loginWay == 2"
            plain
            hairline
            @click="toggleLoginWay(1)"
          >
            账户登录
          </wd-button>
          <view class="checkbox-area">
            <wd-checkbox shape="square" v-model="agree"></wd-checkbox>
            <view>
              登录表示同意
              <text class="link" @tap="goService">服务协议</text>
              和
              <text class="link" @tap="goPrivacy">隐私协议</text>
            </view>
          </view>
        </view>
        <!-- 底部复选框 -->
      </view>
      <wd-notify />
    </view>
  </PageLayout>
</template>

<script lang="ts" setup>
import { useNotify, useToast } from "wot-design-uni";
import { ref } from "vue";
import { useUserStore } from "@/store/user";
import { http } from "@/utils/http";
import {
  ACCESS_TOKEN,
  USER_NAME,
  USER_INFO,
  APP_ROUTE,
  APP_CONFIG,
  HOME_CONFIG_EXPIRED_TIME,
  HOME_PAGE,
} from "@/common/constants";

import { cache, getFileAccessHttpUrl } from "@/common/uitls";
import { useRouter } from "@/plugin/uni-mini-router";
import { useParamsStore } from "@/store/page-params";

defineOptions({
  name: "login",
  options: {
    // apply-shared‌：当前页面样式会影响到子组件样式.(小程序)
    // shared‌：当前页面样式影响到子组件，子组件样式也会影响到当前页面.(小程序)
    styleIsolation: "shared",
  },
});
const router = useRouter();
const defLogo = "static/logo.png";
const shape = ref();
const loading = ref(false);
const userName = ref();
const password = ref();
const phoneNo = ref("");
const smsCode = ref("");
const showPassword = ref(false); //是否显示明文
const loginWay = ref(1); //1: 账密，2：验证码
const smsCountDown = ref(0);
let smsCountInterval = null;
const toggleDelay = ref(false);
const version = ref("");
const compLogo = ref(defLogo);
const compTitle = ref("智趣猴");
const agree = ref(false);
const paramsStore = useParamsStore();
paramsStore.reset();
// 是否开启本地路由配置
let isLocalConfig = getApp().globalData.isLocalConfig;
if (import.meta.env.MODE === "development") {
  userName.value = "15768920110";
  password.value = "Yh12345.";
}

if (import.meta.env.MODE === "production") {
  // userName.value = "15119337951";
  // password.value = "X3a5Z8LmDP";
  userName.value = "15768920110";
  password.value = "Yh12345.";
}

const isSendSMSEnable = computed(() => {
  return smsCountDown.value <= 0 && phoneNo.value.length < 4;
});
const toast = useToast();
const userStore = useUserStore();
const toggleLoginWay = (val) => {
  loginWay.value = val;
};
const handleChangePassword = () => {
  showPassword.value = !showPassword.value;
};
const handleSMSSend = () => {
  let smsParams = { mobile: "", smsmode: "0" };
  smsParams.mobile = phoneNo.value;
  let checkPhone = new RegExp(/^[1]([3-9])[0-9]{9}$/);
  if (!smsParams.mobile || smsParams.mobile.length == 0) {
    toast.warning("请输入手机号");
    return false;
  }
  if (!checkPhone.test(smsParams.mobile)) {
    toast.warning("请输入正确的手机号");
    return false;
  }
  if (smsCountDown.value) {
    return;
  }
  http.post("/sys/sms", smsParams).then((res: any) => {
    if (res.success) {
      smsCountDown.value = 60;
      startSMSTimer();
    } else {
      smsCountDown.value = 0;
      toast.warning(res.message);
    }
  });
};
const goService = () => {
  uni.navigateTo({ url: "/pages/agreement/index" });
};

const goPrivacy = () => {
  uni.navigateTo({ url: "/pages/privacy/index" });
};
const startSMSTimer = () => {
  smsCountInterval = setInterval(() => {
    smsCountDown.value--;
    if (smsCountDown.value <= 0) {
      clearInterval(smsCountInterval);
    }
  }, 1e3);
};
const getSendBtnText = computed(() => {
  if (smsCountDown.value > 0) {
    return smsCountDown.value + "秒后发送";
  } else {
    return "发送验证码";
  }
});
const hanldeLogin = () => {
  loginWay.value === 1 ? accountLogin() : phoneLogin();
};
const accountLogin = () => {
  console.log("----agree:", agree.value);
  if (!agree.value) {
    toast.warning("请认真阅读并同意服务协议和隐私协议");
    return;
  }
  if (userName.value.length === 0) {
    toast.warning("请输入账号");
    return;
  }
  if (password.value.length === 0) {
    toast.warning("请输入密码");
    return;
  }
  loading.value = true;
  http
    .post("/v1/token", {
      client_id: userName.value,
      domain_id: "430edu",
      client_secret: password.value,
      grant_type: "password",
      device_platform: "IOS",
      product_version: "1.1.3",
      device_id: "db69c8ca-740a-4424-8e3d-32324a515c25",
      scope: "user",
      captcha: "",
      system_model: "Apple",
    })
    .then((res: any) => {
      if (res.status === 0) {
        const { result } = res;
        // const userInfo = result.result;
        userStore.setUserInfo({
          ...result,
          token: result.access_token,
          userid: result.client_id,
          expireTime: result.expire_time,
          //username: userInfo.username,
          // realname: userInfo.realname,
          // avatar: userInfo.avatar,
          // tenantId: userInfo.loginTenantId,
          localStorageTime: +new Date(),
        });
        appConfig();
        departConfig();
        router.pushTab({ path: HOME_PAGE });
      } else {
        toast.warning(res.message);
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const phoneLogin = () => {
  let checkPhone = new RegExp(/^[1]([3-9])[0-9]{9}$/);

  if (!phoneNo.value || phoneNo.value.length == 0) {
    toast.warning("请输入手机号");
    return;
  }
  if (!checkPhone.test(phoneNo.value)) {
    toast.warning("请输入正确的手机号");
    return false;
  }
  if (!smsCode.value || smsCode.value.length == 0) {
    toast.warning("请输入短信验证码");
    return;
  }
  let loginParams = {
    mobile: phoneNo.value,
    captcha: smsCode.value,
  };
  http
    .post("/sys/phoneLogin", { mobile: phoneNo.value, captcha: smsCode.value })
    .then((res: any) => {
      if (res.success) {
        const { result } = res;
        const userInfo = result.userInfo;
        userStore.setUserInfo({
          token: result.token,
          userid: userInfo.id,
          username: userInfo.username,
          realname: userInfo.realname,
          avatar: userInfo.avatar,
          tenantId: userInfo.loginTenantId,
          localStorageTime: +new Date(),
        });
        //获取app配置
        appConfig();
        departConfig();
      } else {
        toast.warning(res.message);
      }
    })
    .catch((err) => {
      let msg = err.message || "请求出现错误，请稍后再试";
      toast.warning(msg);
    });
};
//部門配置
const departConfig = () => {
  /*const appQueryUser = () => {
    http
      .get("/sys/user/appQueryUser", {
        username: userStore.userInfo.username,
      })
      .then((res: any) => {
        if (res.success && res.result.length) {
          let result = res.result[0];
          userStore.editUserInfo({ orgCodeTxt: result.orgCodeTxt });
        }
      });
  };
  appQueryUser();*/
};
const appConfig = () => {
  if (isLocalConfig) {
    toast.success("登录成功!");
    router.pushTab({ path: HOME_PAGE });
  } else {
    http
      .get("/eoa/sysAppConfig/queryAppConfigRoute")
      .then((res: any) => {
        if (res.success) {
          cache(APP_ROUTE, res.result.route, HOME_CONFIG_EXPIRED_TIME);
          cache(APP_CONFIG, res.result.config, HOME_CONFIG_EXPIRED_TIME);
        }
        toast.success("登录成功!");
        router.pushTab({ path: HOME_PAGE });
      })
      .catch((err) => {
        toast.success("登录成功!");
        router.pushTab({ path: HOME_PAGE });
      });
  }
};

const loadConfig = () => {
  http.get("/eoa/sysAppConfig/queryAppConfig").then((res: any) => {
    if (res.success) {
      let info = res.result;
      if (info) {
        compLogo.value = getFileAccessHttpUrl(info.appLogo) || defLogo;
        compTitle.value = info.appTitle || "智趣猴";
      } else {
        compLogo.value = defLogo;
      }
    }
  });
};
const checkToken = () => {
  const { userInfo, clearUserInfo } = userStore;
  if (userInfo.token) {
    if (+new Date() - userInfo.localStorageTime > 2 * 3600000) {
      // 超过2小时过期
      clearUserInfo();
    } else {
      router.pushTab({ path: HOME_PAGE });
    }
  } else {
    clearUserInfo();
  }
};
const checkAccount = () => {};
// #ifdef APP-PLUS || H5
checkToken();
checkAccount();
// #endif
// @ts-ignore
if (isLocalConfig === false) {
  loadConfig();
}
</script>

<style lang="scss" scoped>
//

.page-container {
  background: white;
  padding: 0 0upx;
  padding-top: 0upx;
  position: relative;
  height: 100%;
  font-size: 15px;
  color: var(--UI-FG-0);
  .logo-bg {
    width: 100%;
  }
  .logo {
    width: 400upx;
    height: 300px;
  }
  .title {
    font-size: 58upx;
  }
  .enter-area {
    padding-top: 75px;
    width: 87%;
    margin: 0 auto 60upx;
    .box {
      display: flex;
      align-items: center;
      min-height: 100upx;
      color: #000;
      border: 1px solid #eee;
      background-color: #fff;
      padding: 0 20upx;
      margin-bottom: 30upx;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
      :deep(.wd-text) {
        margin: 0 10upx;
      }
      :deep(.wd-input),
      :deep(.uni-input) {
        flex: 1;
        &::after {
          height: 0;
        }
      }
      .uni-input {
        text-align: left;
        font-size: var(--wot-input-fs, var(--wot-cell-title-fs, 14px));
        height: var(--wot-input-inner-height, 34px);
        color: var(--wot-input-color, #262626);
        .uni-input-placeholder {
          color: var(--wot-input-placeholder-color, #bfbfbf);
        }
      }
    }
    :deep(.sendSMSBtn) {
      margin-left: 20upx;
    }
    :deep(.wd-icon-view),
    :deep(.wd-icon-eye-close) {
      color: #555;
    }
  }
  .btn-area {
    :deep(.login) {
      background-color: rgba(208, 120, 39, 1);
      width: 80%;
    }
    :deep(.wd-button) {
      --wot-button-medium-height: 41px;
      --wot-button-medium-fs: 16px;
      --wot-button-plain-bg-color: transparent;
      min-width: 100px;
      box-shadow: 3px 3px 4px rgba(0, 102, 204, 0.2);
    }
  }
  .checkbox-area {
    position: fixed;
    bottom: 200rpx; /* 距离底部的间距，可调整 */
    font-size: 14px;
    color: gray;
    left: 0;
    width: 100%;
    display: flex;
    padding-left: 75upx;
    align-items: center;
  }
  .link {
    color: #007aff;
  }
}
</style>
