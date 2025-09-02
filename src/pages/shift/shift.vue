<route lang="json5" type="page">
{
  layout: "default",
  style: {
    navigationBarTitleText: "demo演示",
    navigationStyle: "custom",
    disableScroll: true, // 微信禁止页面滚动
    "app-plus": {
      bounce: "none", // 禁用 iOS 弹性效果
    },
  },
}
</route>

<template>
  <PageLayout :navbarShow="true" :navLeftArrow="false">
    <view
      style="
        height: 48px;
        align-items: center;
        justify-content: center;
        display: flex;
        background: white;
        border-bottom: 1px solid rgba(200, 200, 200, 0.4);
        font-size: 16px;
        font-weight: bold;
      "
      >排班</view
    >
    <scroll-view scroll-y>
      <view class="shadow-warp" v-for="(item, index) in dataSource">
        <view class="content">
          <template v-if="index === 0">
            <uni-calendar
              style="background-color: #f00"
              class="uni-calendar--hook"
              :showMonth="false"
              :lunar="true"
              @change="change"
              @monthSwitch="monthChange"
              :selected="selected"
            />
          </template>
        </view>
      </view>
      <view
        v-for="(item, index) in schedules"
        :key="index"
        style="background: white; margin-top: 2px"
      >
        <view class="container">
          <view class="left">
            <view>{{ formatTime(item.course_begin_time) }}</view>
            <view>{{ formatTime(item.course_end_time) }}</view>
          </view>
          <view class="right">
            <view style="font-size: 16px; font-weight: bold"
              >{{ item.course_name }} ({{ item.classes_name }})</view
            >
            <view style="font-size: 12px; font-weight: bold"
              >{{ item.primary_teacher_name }}/{{ item.second_teacher_name }}
            </view>
            <view style="font-size: 10px; color: gray">{{
              item.classroom_address
            }}</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </PageLayout>
</template>

<script lang="ts" setup>
//
import { ref } from "vue";
import { useRouter } from "@/plugin/uni-mini-router";
import { useToast, useMessage, useNotify } from "wot-design-uni";
import { us, os } from "@/common/work";
import Grid from "@/components/Grid/Grid.vue";
import { http } from "@/utils/http";
import { useUserStore } from "@/store";

const toast = useToast();
const user = ref("");
const dept = ref("");
const message = useMessage();
const { showNotify, closeNotify } = useNotify();
const dateTime = ref();
const router = useRouter();
const selected = ref([]);
const schedules = ref([]);
const gridData = ref([]);
const handleDateTimeChange = (value) => {
  console.log(value);
};
us.data.forEach((item: any, index) => {
  if (index < 9) {
    gridData.value.push({ text: item.title, img: item.icon, itemKey: index });
  }
});

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTime1(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getDate(date, AddDayCount = 0) {
  if (!date) {
    date = new Date();
  }
  if (typeof date !== "object") {
    date = date.replace(/-/g, "/");
  }
  const dd = new Date(date);

  dd.setDate(dd.getDate() + AddDayCount); // 获取AddDayCount天后的日期

  const y = dd.getFullYear();
  const m =
    dd.getMonth() + 1 < 10 ? "0" + (dd.getMonth() + 1) : dd.getMonth() + 1; // 获取当前月份的日期，不足10补0
  const d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate(); // 获取当前几号，不足10补0
  return {
    fullDate: y + "-" + m + "-" + d,
    year: y,
    month: m,
    date: d,
    day: dd.getDay(),
  };
}
// 时间戳转 yyyy-MM-dd
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const change = (e) => {
  const timestamp = new Date(e.fulldate + " 00:00:00").getTime();
  const userStore = useUserStore();
  const token = userStore.userInfo.token;
  const params = {
    access_token: token,
    scheduleTime: timestamp,
  };
  http
    .get("/v1/course-schedules/schedule", params)
    .then((res: any) => {
      if (res.status === 0) {
        const result = res.result;
        schedules.value = result.map((rs) => rs);
        schedules.value.forEach((item) => console.log(item));
      } else {
        // toast.warning(res.message);
      }
    })
    .finally(() => {
      // loading.value = false;
    });
};
const monthChange = (e) => {
  const userStore = useUserStore();
  const token = userStore.userInfo.token;
  const params = {
    access_token: token,
    year: e.year,
    month: e.month,
  };
  http
    .get("/v1/course-schedules/schedule-range", params)
    .then((res: any) => {
      if (res.status === 0) {
        const result = res.result;
        console.log("---res:", res);
        console.log("---result:", result);
        selected.value = result.map((ts) => ({ date: formatDate(ts) }));
        /*selected.value = [
          { date: getDate(new Date(), 3).fullDate },
        ];*/
      } else {
        // toast.warning(res.message);
      }
    })
    .finally(() => {
      // loading.value = false;
    });
};

const proDataSource = [
  {
    activeStep: true,
    data: [
      { label: "流程节点：start" },
      { label: "申请人：神经蛙02" },
      { label: "申请时间：2023-12-06 16:15:14" },
      { label: "已完成" },
    ],
  },
  {
    activeStep: false,
    data: [
      { label: "流程节点：填写" },
      { label: "申请人：神经蛙01" },
      { label: "申请时间：2023-12-06 16:15:14" },
    ],
  },
  {
    activeStep: false,
    data: [
      { label: "流程节点：填写" },
      { label: "申请人：神经蛙03" },
      { label: "申请时间：2023-12-06 16:15:14" },
    ],
  },
];
const dataSource = ref([
  { title: "万年历组件" },
  { title: "图片预览" },
  // {
  //   group: [
  //     { title: '树组件', path: '/pages/demo/tree' },
  //     { title: '通讯录', path: '/pages/demo/indexBar' },
  //     { title: '单选多选', path: '/pages/demo/selectPicker' },
  //     { title: '表单', path: '/pages/demo/form' },
  //   ],
  // },
]);
const handleSkip = (path) => {
  router.push({ path: path });
};
const handleToast = (value) => {
  switch (value) {
    case 0:
      // 909cb8
      toast.info({ msg: "常规提示信息" });
      break;
    case 1:
      // f0863b
      toast.warning({ msg: "提示信息" });
      break;
    case 2:
      // 33d19d
      toast.success({ msg: "操作成功" });
      break;
    case 3:
      // f04550
      toast.error({ msg: "手机验证码输入错误，请重新输入" });
      break;
    case 4:
      toast.show({ msg: "手机验证码输入错误，请重新输入" });
      break;
  }
};
const handleConfirm = (params) => {
  message
    .confirm({
      msg: "提示文案",
      title: "标题",
    })
    .then(() => {
      showNotify({ type: "success", message: "点击了确认按钮" });
    })
    .catch(() => {
      showNotify({ type: "warning", message: "点击了取消按钮" });
    });
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  // justify-content: space-between; /* 左右两端对齐 */
  align-items: center; /* 垂直居中 */
  padding: 8px;
}

.left {
  /* 左侧内容样式 */
  width: 15%;
  text-align: right;
  padding-right: 8px;
  display: flex;
  flex-direction: column; /* 上下排列 */
  gap: 8px; /* 上下间隔 */
}

.right {
  /* 右侧内容样式 */
  width: 85%;
  border-left: 2px solid rgba(208, 119, 37, 1);
  padding-left: 8px;
}
//
.mb-2 {
  margin-bottom: 10px;
}

.box {
  background-color: #fff;
  margin: 25px 16px;
  .title {
    padding: 10px;
    padding-bottom: 0;
    font-size: 15;
    color: #666666;
    margin-bottom: 20upx;
  }

  .content {
    :deep(.btn),
    :deep(.imgView) {
      margin: 10px;
    }
    :deep(.wd-button) {
      &.info {
        background-color: #909cb8;
      }
      &.warning {
        background-color: #f0863b;
      }
      &.success {
        background-color: #33d19d;
      }
      &.error {
        background-color: #f04550;
      }
    }
  }
}
.router {
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  :deep(.wd-button) {
    margin-bottom: 15px;
    &:nth-child(3),
    &:nth-child(4) {
      margin-bottom: 0;
    }
  }
}
:deep(.wd-cell-group) {
  margin: 0 26upx;
  border-radius: 18upx;
  overflow: hidden;
  --wot-cell-line-height: 32px;
  .wd-icon {
    margin-right: 10px;
  }
  .wd-cell {
    --wot-cell-title-fs: 15px;
    --wot-cell-title-color: var(--color-grey);
    .wd-cell__left {
      font-size: 15px;
      font-weight: 300;
    }
  }
}
</style>
