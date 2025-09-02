<route lang="json5" type="page">
{
  layout: "default",
  style: {
    navigationBarTitleText: "",
    navigationStyle: "custom",
    disableScroll: true, // 微信禁止页面滚动
    "app-plus": {
      bounce: "none", // 禁用 iOS 弹性效果
    },
  },
}
</route>

<template>
  <PageLayout :navbarShow="true" :navLeftArrow="false" navTitle="消息" navLeftText="">
    <view class="wrap">
      <view class="container">
        <view style="font-size: 32px">消息</view>
        <view style="display: flex; gap: 10px;">
          <wd-img
            width="20"
            height="24"
            :round="true"
            :radius="50"
            src="/static/talk.png"
            @click="ChooseImage"
          ></wd-img>
          <wd-img
            width="20"
            height="20"
            :round="true"
            :radius="50"
            src="/static/plus.png"
            @click="ChooseImage"
          ></wd-img>
        </view>
      </view>
      <wd-search placeholder-left hide-cancel/>
      <!--wd-tabs :customClass="getClass()" v-model="tabActive">
        <template v-for="(item, index) in tabList" :key="index">
          <wd-tab :title="item.title" :name="item.key">
            <view class="mainContent">
              <chatList v-if="item.key === '1'"></chatList>
              <addressBookList v-if="item.key === '2'"></addressBookList>
            </view>
          </wd-tab>
        </template>
      </wd-tabs-->
    <wd-status-tip image="content" tip="暂无消息" />
    </view>
  </PageLayout>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import chatList from "./components/chatList.vue";
import addressBookList from "./components/addressBookList.vue";
import { platform, isMp } from "@/utils/platform";
import { useRouter } from "@/plugin/uni-mini-router";
import { useParamsStore } from "@/store/page-params";

defineOptions({
  name: "message",
  options: {
    // apply-shared‌：当前页面样式会影响到子组件样式.(小程序)
    // shared‌：当前页面样式影响到子组件，子组件样式也会影响到当前页面.(小程序)
    styleIsolation: "‌shared‌",
  },
});

const paramsStore = useParamsStore();
const router = useRouter();
const globalData = getApp().globalData;
const { systemInfo, navHeight } = globalData;
const { statusBarHeight } = systemInfo;
console.log("systemInfo:::", systemInfo);
const tabList = ref([
  { key: "1", title: "消息" },
  { key: "2", title: "通讯录" },
]);
const tabActive = ref<string>("1");
const getClass = () => {
  return `${platform} ${isMp ? "mp" : ""}`;
};
const handleGo = () => {
  paramsStore.setPageParams("flowIndex", {
    backRouteName: "message",
  });
  router.push({ name: "flowIndex" });
};
</script>

<style lang="scss" scoped>
.wrap {
  height: 100%;
}
.container {
  height: 80px;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}
:deep(.wd-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
  &.mp {
    .wd-tabs__nav-container {
      padding-right: 87px;
    }
  }
  .wd-tabs__nav {
    height: var(--nav-height);
    padding-top: var(--status-bar-height);
    background: linear-gradient(45deg, #0081ff, #1cbbb4);
    .wd-tabs__nav-item {
      color: #fff;
    }
  }
  .wd-tabs__container {
    flex: 1;
    width: 100%;
  }
  .wd-tabs__body {
    position: relative;
  }
  .wd-tabs__line {
    background-color: #fff;
  }
}
:deep(.wd-tab) {
  .wd-tab__body {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
}
.flow {
  position: relative;
  z-index: 1;
  padding-bottom: 5px;
  background: #fff;
  box-shadow: 0 1px 3px 1px rgba(0, 0, 0, 0.1);
  .content {
    display: flex;
    align-items: center;
    height: 50px;
    padding-left: 15px;
    font-size: 16px;
    color: #666;
    background-color: #f8f8f8;
  }
  .text {
    margin-left: 6px;
    color: #333;
  }
}
.mainContent {
  flex: 1;
  overflow: hidden;
}
</style>
