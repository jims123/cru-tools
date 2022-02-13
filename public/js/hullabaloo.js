/**
 * hullabaloo v 0.4
 *
 */
 (function (root, factory) {
     if (typeof exports === "object") {
         module.exports = factory();
     } else if (typeof define === "function" && define.amd) {
         define(['jquery'], factory);
     } else {
         root.hullabaloo = factory();
     }
 }(this, function () {
   return new function () {

    this.hullabaloo = function() {
      // 目标正在建造中
      // 创建 this.generate()
      this.hullabaloo = {};

      // 提示框对象数组
      this.hullabaloos = [];

      this.success = false;

      // 初始默认参数
      this.options = {
        ele: "body",
        offset: {
          from: "top",
          amount: 20
        },
        align: "right",
        width: 280,
        delay: 3000,
        allow_dismiss: true,
        stackup_spacing: 10,
        text: "发生了未知的错误。",
        icon: {
          success: "fa fa-check-circle",
          info: "fa fa-info-circle",
          warning: "fa fa-life-ring",
          danger: "fa fa-exclamation-circle",
          light: "fa fa-sun",
          dark: "fa fa-moon"
        },
        status: "danger",
        alertClass: "", // 弹出框需要额外添加的类名
        fnStart: false, // 如果传入的是函数则代表弹出前执行
        fnEnd: false, // 弹出结束执行
        fnEndHide: false, // 弹出结束后隐藏时执行
      };
    };

    /*
     * 弹出信息配置
     * text - 信息文字
     * status - 当前状态
     * group - 消息分组
     */
    this.hullabaloo.prototype.send = function(text, status, group = 1) {
      // 弹出前执行
      if (typeof this.options.fnStart == "function")
        this.options.fnStart();

      // 弹出实例自身
      var self = this;
      // 是否遇到相同警报
      var flag = 1;
      // 遍历警报组的变量i
      var i = +this.hullabaloos.length - 1;
      // Главный алерта если уже есть такие же алерты
      var parent;

      // 警报生成器
      var hullabaloo = this.generate(text, status);

      // 是否要求警报分组并且当前警报组队列长度大于0
      if (group && this.hullabaloos.length) {
        // 开始遍历警报组
        while (i >= 0 && flag) {
          // 遇到相同警报
          if (this.hullabaloos[i].text == hullabaloo.text && this.hullabaloos[i].status == hullabaloo.status) {
            // 记录
            parent = this.hullabaloos[i];
            flag = 0;

            // 当前警报将会与前一个相同的那个进行合并显示
            hullabaloo.elem.css(this.options.offset.from, parseInt(parent.elem.css(this.options.offset.from)) + (+parent.hullabalooGroup.length +1)*4);
            hullabaloo.elem.css(this.options.align, parseInt(parent.elem.css(this.options.align)) + (+parent.hullabalooGroup.length +1)*4);
          }
          i--;
        }
      }

      // Проверяем, группа алертов у нас или только один
      if (typeof parent == 'object') {
        // 检测存在与当前同类的警报，将重置该类警报定时器
        clearTimeout(parent.timer);
        // 为该组添加定时器
        parent.timer = setTimeout(function() {
          self.closed(parent);
        }, this.options.delay);
        hullabaloo.parent = parent;
        // 将当前警告放入最先相同元素的hullabalooGroup属性队列中
        parent.hullabalooGroup.push(hullabaloo);
      // 如果未检测到同类
      } else {
        hullabaloo.position = parseInt(hullabaloo.elem.css(this.options.offset.from));

        // 为自身设置消失定时器
        hullabaloo.timer = setTimeout(function() {
          self.closed(self);
        }, this.options.delay);
        // 将警报添加到一般警报阵列中
        this.hullabaloos.push(hullabaloo);
      }

      // 向用户展示警报，淡出
      hullabaloo.elem.fadeIn();

      // 启动淡出完成函数
      if (typeof this.options.fnEnd == "function")
        this.options.fnEnd();
    }


    // 关闭功能
    this.hullabaloo.prototype.closed = function(hullabaloo) {
      var self = this;
      var idx, i, move, next;

      // 目标警报（即要关闭的警报）：如果警报有parent属性，即有同类警报组，hullabaloo为最先出现的警报实例
      if("parent" in hullabaloo){
        hullabaloo = hullabaloo.parent;
      }

      // 检查是否有警报队列
      if (this.hullabaloos !== null) {
        // 从警报组中找到目标警报所在的索引
        idx = $.inArray(hullabaloo, this.hullabaloos);
        if(idx == -1) return;

        // 判断是否是同类警报组，如果是则逐个关掉
        if (!!hullabaloo.hullabalooGroup && hullabaloo.hullabalooGroup.length) {
          for (i = 0; i < hullabaloo.hullabalooGroup.length; i++) {
            $(hullabaloo.hullabalooGroup[i].elem).remove();
          }
        }

        // 把同类警报组的代表parent给关掉
        $(this.hullabaloos[idx].elem).fadeOut("slow", function(){
          this.remove();
        });

        if (idx !== -1) {
          next = idx + 1;
          // 如果警报队列中还有其他警报，则进行移动到目标警报的位置
          if (this.hullabaloos.length > 1 && next < this.hullabaloos.length) {
            //紧随目标警报的下一个警报-目标警报目标警报的位置=要移动的距离
            move = this.hullabaloos[next].position - this.hullabaloos[idx].position;

            // 剩余跟随目标警报的所有警报进行上移
            for (i = next; i < this.hullabaloos.length; i++) {
              this.animate(self.hullabaloos[i], parseInt(self.hullabaloos[i].position) - move);
              self.hullabaloos[i].position = parseInt(self.hullabaloos[i].position) - move
            }
          }

          // 从警报队列中移除目标警报
          this.hullabaloos.splice(idx, 1);

          //启动消息关闭后函数
          if (typeof this.options.fnEndHide == "function")
            this.options.fnEndHide();
        }
      }
    }


    // 警报上移动画功能
    this.hullabaloo.prototype.animate = function(hullabaloo, move) {
      var self = this;
      var timer,
        position, //警报的位置
        i, //遍历同类警报组的变量
        group = 0; // 同类警报组的长度

      // 目标警报的位置
      position = parseInt(hullabaloo.elem.css(self.options.offset.from));
      // 同类警报组的数量
      group = hullabaloo.hullabalooGroup.length;

      // 启动定时器，2是关于动画的步长
      timer = setInterval(frame, 2);
      // 定时器执行函数
      function frame() {
        if (position == move) {
          clearInterval(timer);
        } else {
          position--;
          hullabaloo.elem.css(self.options.offset.from, position);

          // 如果需要上升的警报中有同类警报，则一起提升
          if (group) {
            for (i = 0; i < group; i++) {
              hullabaloo.hullabalooGroup[i].elem.css(self.options.offset.from, position + 4*(i+1));
            }
          }
        }
      }
    }

    // 警报生成器
    this.hullabaloo.prototype.generate = function(text, status) {
      var alertsObj = {
        icon: "", // Иконка
        status: status || this.options.status, // Статус
        text: text || this.options.text, // 文字
        elem: $("<div>"), // HTML код самого алерта

        // 相同的警报组
        hullabalooGroup: []
      };
      var option, // 设置
          offsetAmount, // 位移数值
          css; // CSS属性设置
          self = this;

      option = this.options;

      // 额外添加的类
      alertsObj.elem.attr("class", "hullabaloo alert "+option.alertClass);

      // 添加状态类
      alertsObj.elem.addClass("alert-" + alertsObj.status);

      // 设置允许关闭
      if (option.allow_dismiss) {
        alertsObj.elem.addClass("alert-dismissible");
        alertsObj.elem.append("<button class=\"close\" type=\"button\" id=\"hullabalooClose\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>");
        $( "#hullabalooClose", $(alertsObj.elem) ).bind( "click", function(){
          self.closed(alertsObj);
        });
      }

      // 根据警告弹出的类别进行设置icon
      switch (alertsObj.status) {
        case "success":
          alertsObj.icon = option.icon.success;
          break;
        case "info":
          alertsObj.icon = option.icon.info;
          break;
        case "danger":
          alertsObj.icon = option.icon.danger;
          break;
        case "light":
          alertsObj.icon = option.icon.light;
          break;
        case "dark":
          alertsObj.icon = option.icon.dark;
          break;
        default:
          alertsObj.icon = option.icon.warning;
      }

      // 追加警告弹出的文本内容
      alertsObj.elem.append("<i class=\"" + alertsObj.icon + "\"></i> " + alertsObj.text);

      // 第一个出现的警报位置为option.offset.amount
      offsetAmount = option.offset.amount;

      // 记录最新出现警报的位置
      $(".hullabaloo").each(function() {
        return offsetAmount = Math.max(offsetAmount, parseInt($(this).css(option.offset.from)) + $(this).outerHeight() + option.stackup_spacing);
      });


      // css配置
      css = {
        //设置了限制的父元素内
        "position": (option.ele === "body" ? "fixed" : "absolute"),
        "margin": 0,
        "z-index": "9999",
        "display": "none"
      };
      css[option.offset.from] = offsetAmount + "px";
      alertsObj.elem.css(css);

      if (option.width !== "auto") {
        alertsObj.elem.css("width", option.width + "px");
      }
      $(option.ele).append(alertsObj.elem);
      switch (option.align) {
        case "center":
          alertsObj.elem.css({
            "left": "50%",
            "margin-left": "-" + (alertsObj.elem.outerWidth() / 2) + "px"
          });
          break;
        case "left":
          alertsObj.elem.css("left", "20px");
          break;
        default:
          alertsObj.elem.css("right", "20px");
      }

      return alertsObj;
    };


    return this.hullabaloo;
  }
}));
