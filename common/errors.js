module.exports = {
    ERROR_UNKNOWN: [-1, '内部错误'],
    ERROR_BC_API_CONNECT_FAILED: [100, '区块链WSS API链接失败'],
    ERROR_ACCESS: [401, `你的登录状态已失效，请您重新登录`],
    ERROR_REQUEST_TIMEOUT: [101, '响应超时'],
    ERROR_PARAMS: [1000, '参数错误'],
    ERROR_NO_DATA:[1001, '没有找到对应数据'],
    ERROR_EXISTED:[1002, '数据已存在'],
    ERROR_EXPIRED:[1003, '数据已过期'],
    ERROR_LIMIT:[1004, '请求受限'],
    ERROR_USERNAMEORPASSWORD:[1005, '账户或密码错误'],
    ERROR_DATA_UPDATE_FAILED:[2000, '更新数据失败'],
};