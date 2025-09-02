<route lang="json5" type="page">
{
  layout: "default",
  style: {
    navigationStyle: "custom",
    navigationBarTitleText: "个人",
    disableScroll: true, // 微信禁止页面滚动
    "app-plus": {
      bounce: "none", // 禁用 iOS 弹性效果
    },
  },
}
</route>

<template>
  <PageLayout :navbarShow="true" navTitle="关于智趣猴平台">
    <view class="avatar-area">
      <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
    </view>
    <scroll-view scroll-y style="background: white">
      <wd-cell-group clickable>
        <template v-for="(item, index) in dataSource" :key="index">
          <wd-cell
            :title="item.title"
            style="background: white"
            is-link
            @click="handleCell(item)"
          >
          </wd-cell>
        </template>
      </wd-cell-group>
    </scroll-view>
  </PageLayout>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, onBeforeUnmount } from "vue";
import { cache, getFileAccessHttpUrl, hasRoute } from "@/common/uitls";
import { onLaunch, onShow, onHide, onLoad, onReady } from "@dcloudio/uni-app";
import { useToast, useMessage, useNotify } from "wot-design-uni";
import { useRouter } from "@/plugin/uni-mini-router";
import {
  ACCESS_TOKEN,
  USER_NAME,
  USER_INFO,
  APP_ROUTE,
  APP_CONFIG,
  HOME_CONFIG_EXPIRED_TIME,
} from "@/common/constants";
import { http } from "@/utils/http";
import { useUserStore } from "@/store/user";
import useUpload from "@/hooks/useUpload";
import { getEnvBaseUrl } from "@/utils/index";

//
const userStore = useUserStore();
const toast = useToast();
const router = useRouter();
const message = useMessage();
const defAvatar = "/static/avatar.png";
const personalList = reactive({
  avatar: "",
  realname: "",
  username: "",
  post: "",
  depart: "",
});
console.log(userStore.userInfo);
const userId = ref(userStore.userInfo.client_id);
const token = ref(userStore.userInfo.token);
const realname = ref();
const id = ref("");
let stopWatch: any = null;
const api = {
  positionUrl: "/sys/position/list",
  departUrl: "/sys/user/userDepartList",
  userUrl: "/v1/users/",
  postUrl: "/sys/position/queryByCode",
  uploadUrl: `${getEnvBaseUrl()}/sys/common/upload`,
};
const dataSource = [
  { key: "service", title: "服务协议", class: "cuIcon-settingsfill text-cyan" },
  { key: "privacy", title: "隐私协议", class: "cuIcon-info text-cyan" },
];

const load = () => {
  console.log("------", userId.value);
  if (!userId.value) {
    return;
  }
  http
    .get(api.userUrl + userId.value, { access_token: token.value })
    .then((res: any) => {
      if (res.status === 0) {
        let userInfo = res.result;
        realname.value = userInfo.name;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
const getpost = (code) => {
  if (!code || code.length == 0) {
    personalList.post = "员工";
    return false;
  }
  http
    .get(api.postUrl, { params: { code: code } })
    .then((res: any) => {
      console.log("postUrl", res);
      if (res.success) {
        personalList.post = res.result.name;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const ChooseImage = (params) => {
  const { loading, data, error, run } = useUpload(
    { name: "file" },
    { url: api.uploadUrl },
  );
  if (stopWatch) stopWatch();
  run();
  stopWatch = watch(
    () => [loading.value, error.value, data.value],
    ([loading, err, data], oldValue) => {
      if (loading == false) {
        if (err) {
          // toast.warning('修改失败')
          uni.hideLoading();
        } else {
          if (data) {
            editAvatar(data.message);
          }
        }
      }
    },
  );
};
const editAvatar = (avatar) => {
  http
    .put("/sys/user/appEdit", { id: userId.value, avatar })
    .then((res: any) => {
      if (res.success) {
        toast.success("修改成功~");
        userStore.editUserInfo({ avatar: getFileAccessHttpUrl(avatar) });
        personalList.avatar = getFileAccessHttpUrl(avatar);
      } else {
        toast.warning(res.message);
      }
      uni.hideLoading();
    })
    .catch((err) => {
      uni.hideLoading();
      toast.warning("修改失败");
    });
};
const scan = () => {
  // #ifndef H5
  uni.scanCode({
    success: function (res) {
      console.log("条码res：" + res);
      console.log("条码类型：" + res.scanType);
      console.log("条码内容：" + res.result);
      //条码内容包含QRCODELOGIN则是去扫码登录的逻辑
      if (res.result.indexOf("QRCODELOGIN") != -1) {
        const data = {
          qrcodeId: res.result,
          token: userStore.userInfo.token,
        };
        http({
          url: "/sys/scanLoginQrcode",
          data,
          header: { "content-type": "application/x-www-form-urlencoded" },
          method: "POST",
        }).then((res: any) => {
          console.log("扫码接口返回内容res：", res);
          if (res.success) {
            toast.success(res.result);
          } else {
            toast.warning(res.result);
          }
        });
      }
    },
  });
  // #endif
  // #ifdef H5
  toast.warning("H5暂不支持");
  // #endif
};
const exit = () => {
  message
    .confirm({
      title: "提示",
      msg: "确定退出吗？",
    })
    .then(() => {
      userStore.clearUserInfo();
      router.replaceAll({ name: "login" });
    });
};
const handleCell = (item) => {
  switch (item.key) {
    case "scan":
      scan();
      break;
    case "service":
      uni.navigateTo({ url: "/pages/agreement/index" });
      break;
    case "privacy":
      uni.navigateTo({ url: "/pages/privacy/index" });
      break;
    case "setttings":
      router.push({ name: "userDetail" });
      break;
    case "exit":
      exit();
      break;
    default:
      toast.show("功能暂未开发~");
  }
};
onBeforeUnmount(() => {
  stopWatch?.();
});
onLoad(() => {
  load();
});
onShow(() => {
  load();
});
</script>

<style lang="scss" scoped>
//
.avatar-area {
  background-color: white;
  background-size: cover;
  height: 380upx;
  display: flex;
  justify-content: center;
  overflow: hidden;
  position: relative;
  align-items: center;
  color: black;
  font-weight: bold;
  font-size: 18px;
}
.info-area {
  display: flex;
  padding: 30upx;
  background-color: #fff;
  color: #8799a3;
  :deep(.wd-text.is-default) {
    color: var(--color-grey);
  }
  .user,
  .job {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    .tag {
      display: flex;
      align-items: center;
    }
    :deep(.wd-text.title) {
      font-size: 18px;
      min-height: 18px;
      margin-bottom: 16upx;
    }
  }
  .user {
    border-right: 0.5px solid rgba(0, 0, 0, 0.1);
    :deep(.wd-text.title) {
      color: #f37b1d;
    }
  }
  .job {
    :deep(.wd-text.title) {
      color: #39b54a;
    }
  }
}
:deep(.wd-cell-group) {
  margin: 0 26upx;
  border-radius: 18upx;
  overflow: hidden;
  --wot-cell-line-height: 32px;
  .wd-cell {
    --wot-cell-title-fs: 15px;
    --wot-cell-title-color: var(--color-grey);
    .wd-cell__left {
      font-size: 15px;
    }
  }
}
.logo {
  width: 180upx;
}
</style>
