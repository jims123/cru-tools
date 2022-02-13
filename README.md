# Crust 自动领取奖励工具
### 已实现功能
- 自动领取奖励，并发送邮件提醒
- 批量创建账户，目前没有什么用
- 查看机器的workload
- 机器掉线发送邮件提醒
- 领取奖励账户余额低时发送邮件提醒
- 全网数据统计
- Cru18/Cru24解锁状态显示
- Owner节点质押上限以及余额显示
- Owner节点解锁数量列表倒计时数据显示(非准确数据)
- 添加Owner账户时自动同步Member账户

### 未实现功能
- 连接WallConnect
- 解除质押的Cru
- 解除绑定的Cru
- 解锁Cru18/Cru24

## Environmental requirements
- Source code >= v16.13.2
- Release package by bytecode == v16.3.2

## Installation steps

- 发布的程序包使用步骤
  1. 修改config目录下的system.js.example文件名为system.js,按照注释填写相关内容 
  2. 在程序根目录执行下列操作:
  3. `npm i -g pm2`
  4. `node tools\jscLoader.js generateTable --force`
  5. `pm2 start --name cweb bin/jscLoader.js --max-memory-restart 600M`

- 源码使用步骤
  1. `npm i`
  2. `npm run gen:table:force`
  3. 修改部分代码阻止授权验证和文件hash校验
  4. `npm start`

## FAQ

- 请安装Nodejs和npm后先执行 `npm i -g pm2`;一般官方提供的安装包自带NPM工具
- 自动领取奖励需要去主网创建一个账户，复制助记词填入配置文件，并转入少量CRU用来作为领取奖励时的交易费用，本工具不会扣出该账户的任何余额，提醒：该账户不需要太多CRU
- 使用发布的软件包NodeJS版本必须是v16.13.2 [官网地址](https://nodejs.org/dist/v16.13.2/) ，如果直接使用源码部署Nodejs需要>=v16.3.2
- 访问地址:https://[你的IP]:[配置的端口]
- 默认登录名(admin),密码(admin) **括号内的内容**
- 如果再局域网其他主机访问请注意防火墙
- 如果发现网页加载缓慢，请尝试修改配置文件的`crustApi`
  - 可用参考:
  - wss://api.decloudf.com
  - wss://rpc-crust-mainnet.decoo.io
  - wss://rpc.crust.network
- 默认使用sqlite数据库，也可使用mysql，需要修改两处代码:
  - `common/global_defines.js` 取消注释 122-132行
  - `common/global_defines.js` 注释115-119行