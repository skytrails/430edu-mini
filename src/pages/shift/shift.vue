<route lang="json5" type="page">
{
  layout: "default",
  style: {
    navigationBarTitleText: "排班",
    navigationStyle: "custom",
    disableScroll: true, // 微信禁止页面滚动
    "app-plus": {
      bounce: "none", // 禁用 iOS 弹性效果
    },
  },
}
</route>

<template>
  <PageLayout
    :navbarShow="true"
    :navLeftArrow="false"
    navTitle="排班"
    navLeftText=""
  >
    <scroll-view scroll-y style="background: white">
      <view class="content">
        <uni-calendar
          ref="calendarRef"
          style="background-color: #f00"
          class="uni-calendar--hook"
          :showMonth="false"
          :lunar="true"
          @change="change"
          @monthSwitch="monthChange"
          :selected="selected"
        />
      </view>
      <view
        v-for="(item, index) in schedules"
        :key="index"
        style="background: white"
      >
        <view class="container">
          <view class="left">
            <view>{{ formatTime(item.course_begin_time) }}</view>
            <view>{{ formatTime(item.course_end_time) }}</view>
          </view>
          <view class="right">
            <view>
              <view
                style="
                  font-size: 16px;
                  line-height: 18px;
                  color: #191919;
                  font-weight: 700;
                "
              >
                {{ item.course_name
                }}{{ item.classes_name ? ` (${item.classes_name})` : "" }}
              </view>
              <view
                style="
                  font-size: 14px;
                  line-height: 14px;
                  margin-top: 8px;
                  color: #191919;
                "
              >
                {{ item.primary_teacher_name }}/{{ item.second_teacher_name }}
              </view>
              <view
                style="
                  font-size: 13px;
                  line-height: 13px;
                  color: #7f7f7f;
                  margin-top: 8px;
                "
              >
                {{ item.classroom_address }}
              </view>
            </view>

            <!-- 点名按钮 -->
            <view>
              <button
                class="btn"
                style="margin-top: 5px; font-size: 12px"
                @click="onButtonClick(index)"
                data-id="{{ item.id }}"
              >
                点名
              </button>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </PageLayout>
</template>

<script lang="ts" setup>
//
import { onReady } from "@dcloudio/uni-app";
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
const scheduleInfo = ref(null);
const calendarRef = ref(null);
const message = useMessage();
const { showNotify, closeNotify } = useNotify();
const dateTime = ref();
const router = useRouter();
const selected = ref([]);
const schedules = ref([]);
const gridData = ref([]);
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
        scheduleInfo.value = result;
      } else {
        toast.warning(res.message);
      }
    })
    .finally(() => {
      // loading.value = false;
    });
};

function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();

  // 把今天的时间重置为 00:00:00，方便比较
  today.setHours(0, 0, 0, 0);

  return date.getTime() <= today.getTime();
}

const onButtonClick = (idx) => {
  const params = {
    courseInfoId: scheduleInfo.value?.[idx]?.course_info_id,
    courseBeginTime: scheduleInfo.value?.[idx]?.course_begin_time,
    courseEndTime: scheduleInfo.value?.[idx]?.course_end_time,
    lesson: scheduleInfo.value?.[idx]?.lesson,
    scheduleTime: scheduleInfo.value?.[idx]?.schedule_time,
    classroomAddress: scheduleInfo.value?.[idx]?.classroom_address,
    classesName: scheduleInfo.value?.[idx]?.classes_name,
    courseTotal: scheduleInfo.value?.[idx]?.course_total,
    courseName: scheduleInfo.value?.[idx]?.course_name,
  };
  if (!isToday(params.scheduleTime)) {
    toast.warning("未来日期不可点名");
    return;
  }

  router.push({ path: "/pages/shift/info", query: params });
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
        selected.value = result.map((ts) => ({ date: formatDate(ts) }));
      } else {
        toast.warning(res.message);
      }
    })
    .finally(() => {
      // loading.value = false;
    });
};

const handleSkip = (path) => {
  router.push({ path: path });
};

const load = () => {
  const userStore = useUserStore();
  const token = userStore.userInfo.token;
  const now = new Date();
  // let year = now.getFullYear();
  // let month = now.getMonth() + 1;
  const day = now.getDate();

  let year = calendarRef.value?.calendar?.year;
  let month = calendarRef.value?.calendar?.month;
  if (year === undefined || month === undefined) {
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  if (!token) {
    toast.warning("用户未登录");
  }
  let params = {
    access_token: token,
    year: year,
    month: month,
  };
  http.get("/v1/course-schedules/schedule-range", params).then((res: any) => {
    if (res.status === 0) {
      const result = res.result;
      selected.value = result.map((ts) => ({ date: formatDate(ts) }));
    } else {
      toast.warning(res.message);
      if (res.status === 10011) {
        userStore.clearUserInfo();
        uni.navigateTo({ url: "/pages/login/login" });
      }
    }
  });

  const timestamp = new Date(`${year}-${month}-${day} 00:00:00`).getTime();
  params = {
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
        scheduleInfo.value = result;
      } else {
        // toast.warning(res.message);
      }
    })
    .finally(() => {
      // loading.value = false;
    });
};

onReady(() => {
  load();
});

onShow(() => {
  load();
});
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
  border-left: 2px solid #ee782b;
  padding: 4px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  width: 80px;
  height: 30px;
  font-size: 14px;
  line-height: 30px;
  text-align: center;
  color: #ffffff;
  background: #ee782b;
  border-radius: 15px;
  margin-left: 12px;
  margin: auto;
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
