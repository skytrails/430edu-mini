import { defineStore } from "pinia";
import { ref } from "vue";

const initState = {
  token: "",
  userid: "",
  username: "",
  realname: "",
  welcome: "",
  avatar: "",
  tenantId: 0,
  phone: "",
  email: "",
  sex: 1,
  deviceId: "",
  birthday: "",
  loginTenantId: 0,
  // 本地存储时间
  localStorageTime: 0,
  // 组织编码名称
  orgCodeTxt: "",
};

export const useUserStore = defineStore(
  "user",
  () => {
    const userInfo = ref<IUserInfo>({ ...initState });
    const setUserInfo = (val: IUserInfo) => {
      if (val?.loginTenantId) {
        val.tenantId = val.loginTenantId;
      }
      userInfo.value = val;
    };
    const clearUserInfo = () => {
      const phone = userInfo.value.phone;
      userInfo.value = { ...initState, phone };
    };
    const getUserInfo = () => {
      return userInfo.value;
    };
    const editUserInfo = (options: any) => {
      userInfo.value = { ...userInfo.value, ...options };
    };
    const setTenant = (tenantId: string) => {
      userInfo.value.tenantId = tenantId;
    };
    const getTenant = () => {
      return userInfo.value.tenantId;
    };
    const setDeviceId = (deviceId: string) => {
      userInfo.value.deviceId = deviceId;
    };
    const getDeviceId = () => {
      return userInfo.value.deviceId;
    };
    // 一般没有reset需求，不需要的可以删除
    const reset = () => {
      const deviceId = userInfo.value.deviceId;
      userInfo.value = { ...initState, deviceId };
    };
    const isLogined = computed(() => !!userInfo.value.token);
    return {
      userInfo,
      setUserInfo,
      getUserInfo,
      clearUserInfo,
      setTenant,
      getTenant,
      isLogined,
      editUserInfo,
      setDeviceId,
      getDeviceId,
      reset,
    };
  },
  {
    // 如果需要持久化就写 true, 不需要持久化就写 false（或者去掉这个配置项）
    persist: true,
  },
);
