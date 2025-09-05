<route lang="json5" type="page">
{
  layout: "default",
  style: {
    navigationStyle: "custom",
    navigationBarTitleText: "点名册",
    disableScroll: true, // 微信禁止页面滚动
    "app-plus": {
      bounce: "none", // 禁用 iOS 弹性效果
    },
  },
}
</route>

<template>
  <PageLayout NavTitle="abc">
    <view class="avatar-area flex">
      <div class="flex">
        <wd-img
          width="64"
          height="64"
          src="/static/logo.png"
          @click="ChooseImage"
        ></wd-img>
        <div class="title">
          <div class="title-01">pa拜谒测试</div>
          <div class="title-02">1年1班</div>
        </div>
      </div>
    </view>
    <view class="info-area mb-2">
      <view class="user">
        <wd-text custom-class="title" :text="38"></wd-text>
        <view class="tag">
          <wd-text text="应到人数"></wd-text>
        </view>
      </view>
      <view class="job">
        <!-- prettier-ignore -->
        <wd-text custom-class="title" text="第1节"></wd-text>
        <view class="tag">
          <wd-text text="09:00 - 20:00"></wd-text>
        </view>
      </view>
    </view>
    <wd-tabs
      class="tabs-container"
      color="#ee782b"
      inactiveColor="#000"
      animated
      autoLineWidth
      lineHeight="2"
    >
      <wd-tab v-for="item in tabs" :key="item.value" :title="item.label">
        <view class="tab-content">
          <scroll-view scroll-y class="scroll-box">
            <view v-for="(it, index) in rolls" :key="index" class="list-item">
              <view class="list-left">
                <wd-img
                  width="36"
                  height="36"
                  round
                  src="/static/feman.png"
                ></wd-img>
                <view>
                  {{ it.name }}
                </view>
              </view>
              <view class="list-right">
                <view> 联系人 </view>
                <view> 缺勤 </view>
                <view> 签到 </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </wd-tab>
    </wd-tabs>
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
const personalList = reactive({
  avatar: "",
  realname: "",
  username: "",
  post: "",
  depart: "",
});
const userId = ref(userStore.userInfo.userid);
const realname = ref(userStore.userInfo.realname);
let rolls = [
  { id: 0, name: "张三", type: 0, sex: 0 },
  { id: 0, name: "王五", type: 0, sex: 0 },
  { id: 1, name: "李四", type: 2, sex: 1 },
  { id: 1, name: "卓七", type: 2, sex: 1 },
];
const id = ref("");
let stopWatch: any = null;
const api = {
  positionUrl: "/sys/position/list",
  departUrl: "/sys/user/userDepartList",
  userUrl: "/sys/user/queryById",
  postUrl: "/sys/position/queryByCode",
  uploadUrl: `${getEnvBaseUrl()}/sys/common/upload`,
};
const dataSource = [
  { key: "organization", title: "组织", class: "cuIcon-taoxiaopu text-cyan" },
  { key: "location", title: "定位", class: "cuIcon-location text-cyan" },
  { key: "setttings", title: "设置", class: "cuIcon-settingsfill text-cyan" },
  { key: "exit", title: "退出", class: "cuIcon-exit text-yellow" },
];
const tabs = [
  { value: 0, label: "全部" },
  { value: 1, label: "留校托管" },
  { value: 2, label: "家长接送" },
  { value: 3, label: "自行回家" },
  { value: 4, label: "住校" },
  { value: 5, label: "乘坐校巴" },
];

const load = () => {
  if (!userId.value) {
    return;
  }
  http
    .get(api.userUrl, { id: userId.value })
    .then((res: any) => {
      if (res.success) {
        let perArr = res.result;
        let avatar =
          perArr.avatar && perArr.avatar.length > 0
            ? getFileAccessHttpUrl(perArr.avatar)
            : "/static/avatar_boy.png";
        personalList.avatar = avatar;
        personalList.realname = perArr.realname;
        personalList.username = perArr.username;
        personalList.depart = perArr.departIds;
        getpost(perArr.post);
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
    case "location":
      router.push({ name: "location" });
      break;
    case "organization":
      router.push({ name: "organization" });
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
  // load();
});
</script>

<style lang="scss" scoped>
//
.avatar-area {
  background: white;
  height: 200upx;
  display: flex;
  padding: 100upx 40upx;
  justify-content: center;
  overflow: hidden;
  position: relative;
  flex-direction: column;
  font-weight: 300;
}
.info-area {
  display: flex;
  padding: 40upx 0upx;
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

.title {
  justify-content: center;
  align-content: center;
}

.title-01 {
  color: #191919;
  font-size: 16px;
  font-weight: 700;
  line-height: 14px;
  margin-top: 8px;
  margin-left: 8px;
}

.title-02 {
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 400;
  margin-top: 8px;
  margin-left: 8px;
}
.tabs-container {
  display: flex;
  flex-direction: column;
  color: #000;
  height: 100vh; /* 或者 100% 父容器 */
}

.tab-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.scroll-box {
  flex: 1; /* 关键：scroll-view 占满剩余高度 */
  overflow: auto; /* 保证超出时滚动 */
}
:deep(.wd-tabs__line) {
  background-color: #ee782b !important; /* 修改底部条颜色 */
}
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-content: center;
  margin: 16px 18px;
}
.list-left {
  display: flex;
  align-items: center;
  align-content: center;
  gap: 10px;
}
.list-right {
  display: flex;
  align-items: center;
  align-content: center;
  gap: 16px;
  color: #ee782b;
}
</style>
