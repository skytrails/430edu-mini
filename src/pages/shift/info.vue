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
        <wd-img width="64" height="64" src="/static/logo.png"></wd-img>
        <div class="title">
          <div class="title-01">{{ courseInfo.courseName }}</div>
          <div class="title-02">{{ courseInfo.classroomAddress }}</div>
        </div>
      </div>
    </view>
    <view class="info-area mb-2">
      <view class="user">
        <wd-text custom-class="title" :text="`${students.length}`"></wd-text>
        <view class="tag">
          <wd-text text="应到人数"></wd-text>
        </view>
      </view>
      <view class="job">
        <view
          class="flex"
          style="
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
          "
        >
          <view>第</view>
          <wd-text
            custom-class="title"
            :text="`${courseInfo.lesson}`"
          ></wd-text>
          <view>节</view>
        </view>
        <view class="tag">
          <wd-text
            :text="`${formatSecondsToHM(courseInfo.courseBeginTime)} - ${formatSecondsToHM(courseInfo.courseEndTime)}`"
          ></wd-text>
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
      @click="handleClick"
    >
      <wd-tab
        v-for="item in tabs"
        :key="item.value"
        :name="item.label"
        :title="item.label"
      >
        <view class="tab-content">
          <view class="loading-box" v-if="loading">
            <wd-loading size="50px" color="#ee782b" />
            <text class="loading-text">加载中...</text>
          </view>
          <scroll-view scroll-y class="scroll-box">
            <view
              v-if="studentList.length > 0"
              v-for="(it, index) in studentList"
              :key="index"
              class="list-item"
            >
              <view class="list-left">
                <wd-img
                  v-if="it.student_gender === 'FEMALE'"
                  width="36"
                  height="36"
                  round
                  src="/static/feman.png"
                ></wd-img>
                <wd-img
                  v-else
                  width="36"
                  height="36"
                  round
                  src="/static/man.png"
                ></wd-img>
                <view>
                  {{ it.student_name }}
                </view>
                <wd-tag
                  v-if="it.roll_book_state === 'COME'"
                  custom-class="space"
                  bg-color="rgba(0, 190, 90, 1)"
                  >已到</wd-tag
                >
                <wd-tag
                  v-if="it.roll_book_state === 'NO_COME'"
                  custom-class="space"
                  type="danger"
                  >缺勤</wd-tag
                >
              </view>
              <view class="list-right">
                <view @click="handleContact(it)"> 联系人 </view>
                <view
                  v-if="it.roll_book_state !== 'NO_COME'"
                  @click="handleAbsent(it)"
                >
                  缺勤
                </view>
                <view
                  v-if="it.roll_book_state !== 'COME'"
                  @click="handleSign(it)"
                >
                  签到
                </view>
              </view>
            </view>
            <wd-status-tip
              v-else
              v-if="!loading"
              image="content"
              tip="暂无内容"
            />
          </scroll-view>
        </view>
      </wd-tab>
    </wd-tabs>
    <wd-popup
      v-model="show"
      root-portal
      position="center"
      custom-style="height: 200px; width: 75vw; border-radius: 8px;"
      closable
      @close="handlePopupClose"
    >
      <text class="pop-title center mt-3">联系人</text>
      <view class="mt-8 ml-6 mr-8 flex pop-group center">
        <view>
          <view class="pop-title-01">班主任</view>
          <view class="pop-title-02 mt-2">{{ teacherPhone }}</view>
        </view>
        <view class="pop-btn">呼叫</view>
      </view>
      <view class="mt-4 ml-6 mr-8 flex pop-group center">
        <view>
          <view class="pop-title-01">家长</view>
          <view class="pop-title-02 mt-2">{{ householderPhone }}</view>
        </view>
        <view class="pop-btn">呼叫</view>
      </view>
    </wd-popup>
    <view class="floating-btn">
      <view class="btn-item btn-black radius"
        >已到：{{ statistic.signed }}</view
      >
      <view class="btn-item btn-black">缺勤：{{ statistic.absent }}</view>
      <!--view class="btn-item" @click="handleSubmit">提交</view-->
      <view class="btn-item" @click="handleSubmit">
        <template v-if="submitting">
          <wd-loading size="18px" color="#FFF" />
          <text class="loading-text">提交中...</text>
        </template>
        <template v-else> 提交 </template>
      </view>
    </view>
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
const statistic = ref({ signed: 0, absent: 0 });
const courseInfo = ref(null);
const toast = useToast();
const router = useRouter();
const message = useMessage();
const students = ref([]);
const show = ref(false);
const teacherPhone = ref("");
const householderPhone = ref("");
const submitting = ref(false);
const personalList = reactive({
  name: "",
  sex: "",
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
  studentsUrl: "/v1/rollbooks/students",
  submitUrl: "/v1/rollbooks/submit-roll",
};

const tabs = [
  { value: 0, label: "全部" },
  { value: 1, label: "留校托管" },
  { value: 2, label: "家长接送" },
  { value: 3, label: "自行回家" },
  { value: 4, label: "住校" },
  { value: 5, label: "乘坐校巴" },
];

const studentList = ref([]);
const loading = ref(true);

// 将秒数转成 HH:mm
const formatSecondsToHM = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const load = (options) => {
  const userStore = useUserStore();
  const token = userStore.userInfo.token;
  const params = {
    scheduleTime: options.scheduleTime,
    courseInfoId: options.courseInfoId,
    lesson: options.lesson,
    access_token: token,
    classesName: options.classesName,
  };
  loading.value = true;
  http
    .get(api.studentsUrl, params)
    .then((res: any) => {
      if (res.status === 0) {
        students.value = res.result;
        studentList.value = res.result;

        statistic.value.signed = students.value.filter(
          (s) => s.roll_book_state === "COME",
        ).length;
        statistic.value.absent = students.value.filter(
          (s) => s.roll_book_state === "NO_COME",
        ).length;
      }
      loading.value = false;
    })
    .finally(() => {
      loading.value = false;
    })
    .catch((err) => {
      loading.value = false;
      console.log(err);
    });
};

const handleContact = (e) => {
  show.value = true;
  householderPhone.value = e.householder_phone || "无";
  teacherPhone.value = e.teacher_phone || "无";
};
function updateStateById(studentId: string, state: string) {
  const student = students.value.find((s) => s.student_id === studentId);
  if (student) {
    student.roll_book_state = state;
  }
}
const handleAbsent = (e) => {
  updateStateById(e.student_id, "NO_COME");
  statistic.value.signed = students.value.filter(
    (s) => s.roll_book_state === "COME",
  ).length;
  statistic.value.absent = students.value.filter(
    (s) => s.roll_book_state === "NO_COME",
  ).length;
};
const handleSign = (e) => {
  updateStateById(e.student_id, "COME");
  statistic.value.signed = students.value.filter(
    (s) => s.roll_book_state === "COME",
  ).length;
  statistic.value.absent = students.value.filter(
    (s) => s.roll_book_state === "NO_COME",
  ).length;
};
const handlePopupClose = (e) => {
  show.value = false;
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
const handleClick = (item) => {
  if (item.index === 0) {
    studentList.value = students.value;
  } else {
    studentList.value = students.value.filter(
      (student) => student.after_course == item.name,
    );
  }
};

const handleSubmit = () => {
  const userStore = useUserStore();
  const token = userStore.userInfo.token;
  const userId = userStore.userInfo.userid;
  students.value.forEach((s) => {
    s.come = s.roll_book_state === "COME";
  });
  const body = {
    course_info_id: courseInfo.value.courseInfoId,
    teacher_user_id: userId,
    lesson: courseInfo.value.lesson,
    course_begin_time: courseInfo.value.courseBeginTime,
    course_end_time: courseInfo.value.courseEndTime,
    classes_name: courseInfo.value.classesName,
    course_time: courseInfo.value.scheduleTime,
    students: students.value,
  };
  submitting.value = true;
  http
    .post(api.submitUrl + "?access_token=" + token, body)
    .then((res: any) => {
      if (res.status === 0) {
        toast.success("提交成功");
        //router.back();
      }
    })
    .finally(() => {
      submitting.value = false;
    })
    .catch((err) => {
      console.log(err);
      toast.success("提交失败");
    });
};

onLoad((options) => {
  courseInfo.value = options;
  load(options);
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
      font-size: 28px;
      min-height: 18px;
      margin-bottom: 16upx;
    }
  }
  .user {
    border-right: 0.5px solid rgba(0, 0, 0, 0.1);
    :deep(.wd-text.title) {
      color: #ee782b;
    }
  }
  .job {
    :deep(.wd-text.title) {
      color: #ee782b;
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
  margin-left: 14px;
}

.title-02 {
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 400;
  margin-top: 8px;
  margin-left: 14px;
}
.tabs-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(50vh); /* ⚠️ scroll-view 才能占满 */
  padding-bottom: 40px;
}

.scroll-box {
  flex: 1; /* 关键：scroll-view 占满剩余高度 */
  min-height: 0;
  overflow: auto;
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
/* 悬浮按钮 */
.floating-btn {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  height: 45px; /* 父容器高度，可根据需求调整 */
  border-radius: 24px;
  background: #ee782b;
  display: flex;
  justify-content: space-between;
  align-items: stretch; /* 子元素高度跟父容器一致 */
  padding: 0; /* 内边距去掉，方便按钮充满高度 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-item {
  flex: 1;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0; /* 先去掉圆角，后面单独设置 */
  font-size: 16px;
  color: white;
  height: 100%; /* 高度跟父容器一致 */
}

.btn-item.radius {
  border-top-left-radius: 24px;
  border-bottom-left-radius: 24px;
}
.loading-text {
  margin-left: 10rpx;
  font-size: 28rpx;
}

.btn-black {
  background: black;
}
:deep(.space) {
  padding: 4px 8px;
  border-radius: 4px;
}
.pop-title {
  font-weight: bold;
  font-size: 18px;
}
.pop-group {
  justify-content: space-between;
}
.pop-btn {
  background: #ee782b;
  text-align: center;
  align-content: center;
  border-radius: 14px;
  width: 80px;
  height: 30px;
  color: white;
}
.pop-title-01 {
  font-size: 16px;
  font-weight: 500;
  color: #1f1f1f;
}
.pop-title-02 {
  font-size: 12px;
  color: #7f7f7f;
}
.loading-box {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  padding: 40rpx 0; /* 加点内边距，不会贴太紧 */
}
.loading-text {
  font-weight: 700;
  color: #fff;
}
</style>
