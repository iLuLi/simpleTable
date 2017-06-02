(function($) {
  /************************ployfill***********************************/
  // 实现 ECMA-262, Edition 5, 15.4.4.19
  // 参考: http://es5.github.com/#x15.4.4.19
  if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {

      var T, A, k;

      if (this == null) {
        throw new TypeError(" this is null or not defined");
      }

      // 1. 将O赋值为调用map方法的数组.
      var O = Object(this);

      // 2.将len赋值为数组O的长度.
      var len = O.length >>> 0;

      // 3.如果callback不是函数,则抛出TypeError异常.
      if (Object.prototype.toString.call(callback) != "[object Function]") {
        throw new TypeError(callback + " is not a function");
      }

      // 4. 如果参数thisArg有值,则将T赋值为thisArg;否则T为undefined.
      if (thisArg) {
        T = thisArg;
      }

      // 5. 创建新数组A,长度为原数组O长度len
      A = new Array(len);

      // 6. 将k赋值为0
      k = 0;

      // 7. 当 k < len 时,执行循环.
      while(k < len) {

        var kValue, mappedValue;

        //遍历O,k为原数组索引
        if (k in O) {

          //kValue为索引k对应的值.
          kValue = O[ k ];

          // 执行callback,this指向T,参数有三个.分别是kValue:值,k:索引,O:原数组.
          mappedValue = callback.call(T, kValue, k, O);

          // 返回值添加到新数组A中.
          A[ k ] = mappedValue;
        }
        // k自增1
        k++;
      }

      // 8. 返回新数组A
      return A;
    };      
  }
  /************************ployfill***********************************/
  
  Utils = {};
  Utils.Extend = function (ChildClass, SuperClass) {
    var __hasProp = {}.hasOwnProperty;

    function BaseConstructor() {

    }

    for (var key in SuperClass) {
      if (__hasProp.call(SuperClass, key)) {
        ChildClass[key] = SuperClass[key];
      }
    }
    BaseConstructor.prototype = SuperClass.prototype;
    ChildClass.prototype = new BaseConstructor();
    ChildClass.prototype.constructor = ChildClass;
    ChildClass.__super__ = SuperClass.prototype;

    return ChildClass;
  };
  function Observable() {
    this.listener = {};
  }
  Observable.prototype.on = function(event, fn) {
    this.listener = this.listener || {};
    if(this.listener[event]) {
      this.listener[event].push(fn);
    } else {
      this.listener[event] = [fn];
    }
  }
  Observable.prototype.trigger = function(event) {
    var slice = Array.prototype.slice;
    var params = slice.call(arguments, 1);

    this.listener = this.listener || {};

    if(params == null) {
      params = [];
    }
    if(params.length == 0) {
      params.push({});
    }
    params[0]._type = event;
    if(event in this.listener) {
      this.invoke(this.listener[event], params);
    } 
    if("*" in this.listener) {
      this.invoke(this.listener["*"], params);
    }
  }
  Observable.prototype.invoke = function(fns, params) {
    for(var i = 0;i < fns.length;i++) {
      fns[i].apply(this, params);
    }
  }
  Utils.Observable = Observable;
  Utils.bind = function(context, fn) {
    return function() {
      fn.apply(context, arguments);
    }
  }
  //单例
  function createMask() {
    var mask = $('<div class="mask modal-backdrop fade"></div>');
    if($(".mask").length == 0) {
      $("body").append(mask);
      return mask;
    } else {
      return $(".mask");
    }
  }
 


  function SimpleTable(element, opts) {
    SimpleTable.__super__.constructor.call(this);
    this.$table = element;
    this.options = new Options(opts);
    this.pagination = new Pagination(element, this.options);
    this.init();

    this.$table.data("simpleTable", this);
  }
  Utils.Extend(SimpleTable, Utils.Observable);
  SimpleTable.prototype.init = function() {
    this.$mask = createMask();
    this.initThead();
    this.initTbody();
    this.bindEvent();
  }
  SimpleTable.prototype.bindEvent = function() {
    this.on("s.load", Utils.bind(this, this.loadData));
  }
  SimpleTable.prototype.initThead = function() {
    //检查是否存在thead
    if(this.$table.find("thead").length == 0) {
      var thead = [];
      if(this.options.isCheckbox()) {
        thead.push("<th style='width:50px'><input type='checkbox' name='s-checkbox-all' class='s-checkbox'></th>");
      }
      var colmuns = this.options.get("colmuns");
      if($.isArray(colmuns)) {
        $.each(colmuns, function(i, col) {
          var $th = $("<th></th>").html(col.title);
          if(col.width) {
            $th.width(col.width);
          }
          thead.push($th.get(0).outerHTML);
        });
      }
      this.$table.append("<thead><tr>" + thead.join("") + "</tr></thead>");
    }
    //设置宽度
    
  }
  SimpleTable.prototype.initTbody = function() {
    this.data = {};
    this.loadData();
  }
  SimpleTable.prototype.loadData = function() {
    var loadAjax = this.options.loadAjax();
    var self = this;
    if(loadAjax) {
      var ajax = $.ajax(loadAjax);
      ajax["data"] = this.loadParams();
      ajax.done(Utils.bind(self, this.loadSuccess)).fail(Utils.bind(self, this.loadError));
    } else {
      var loadFn = this.options.get("ajax");
      if(typeof loadFn == "function") {
        loadFn(this.loadParams(), Utils.bind(self, this.renderBody), Utils.bind(self, this.loadError));
      }
    }
  }
  SimpleTable.prototype.renderBody = function(data) {
    var list = data.list;
    var self = this;
    this.$table.find("tbody").remove();
    $.each(list, function(i, rowData) {
      self.renderRow(rowData);
    });
    this.pagination.update(data);
  }
  SimpleTable.prototype.renderRow = function(rowData, tr) {
    var tds = [];
    var self = this;
    if(self.options.isCheckbox()) {
      tds.push("<td><input type='checkbox' name='s-checkbox' class='s-checkbox'></td>");
    }
    $.each(this.options.get("colmuns"), function(i, col) {
      var pattern = col.data;
      var d = rowData;
      if(pattern) {
        if(typeof pattern == "string") {
          var keys = pattern.split(".");
          $.each(keys, function(a, key) {
            if(/^\[\d+\]$/.test(key)) {
              d = d[parseInt(key.replace(/[\[\]]/g, ""))];
            } else {
              d = d[key];
            }
          });
        } else if(typeof pattern == "function") {
          d = pattern(d);
        }
      }
      var text = d;
      if(col.render && typeof col.render == "function") {
        text = col.render(d);
      }
      tds.push("<td>" + text + "</td>");
    });
    if(tr) {
      tr.html(tds.join("")).data("data", rowData);
    } else {
      var $tbody = this.$table.find("tbody");
      if($tbody.length == 0) {
        $tbody = $("<tbody></tbody>").appendTo(this.$table);
      }
      $("<tr>" + tds.join("") + "</td>").data("data", rowData).appendTo($tbody);
    }
    
  }
  SimpleTable.prototype.loadParams = function() {
    return $.extend(true, {}, this.pagination.getParams(), {action: "load"});
  }
  SimpleTable.prototype.loadSuccess = function(data) {
    if(data.code == 0) {
      this.renderBody(data);
    } else {
      this.loadError(data.error);
    }
  }
  SimpleTable.prototype.loadError = function(error) {

  }

  function createModal() {
    var modal = [];
    modal.push('<div id="s-modal" class="modal fade" tabindex="-1" role="dialog">');
    modal.push('<div class="modal-dialog" role="document">');
    modal.push('<div class="modal-content">');
    modal.push('<div class="modal-header">');
    modal.push('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
    modal.push('<h4 class="modal-title"></h4>');
    modal.push('</div>');
    modal.push('<div class="modal-body">');
    modal.push('');
    modal.push('</div>');
    modal.push('<div class="modal-footer">');
    modal.push('<span class="error" style="color: red;margin-right: 20px;"></span>')
    modal.push('<button type="button" class="ok btn btn-primary"></button>');
    modal.push('</div>');
    modal.push('</div>');
    modal.push('</div>');
    modal.push('</div>');
    return modal.join("");
  }

  function Editor(element, options) {
    this.$table = element;
    this.options = options;
    this.isOpen = false;
    this.action = "";
    this.isTemplate = !!this.options.get("editor") && !!this.options.get("editor")["template"];
  }
  Editor.prototype.init = function() {
    var self = this;
    if(this.isTemplate) {
      this.$modal = this.options.get("editor")["template"];
    } else {
      this.$modal = $(createModal());
      this.$modal.appendTo($("body"));
    }
  }
  Editor.prototype.createField = function(field) {
    switch(field.type) {
      case 'text':
      case 'password':
      case 'hidden':
        temp = "<input class='form-control' type='" + field.type + "' name='" + field.name + "'>";
        break;
      case 'select':
        temp = "<select class='form-control' name='" + field.name + "'>";
        temp += model.options.map(function(option) {
          return "<option value='" + option.value + "'>" + option.text + "</option>";
        }).join("");
        temp += "</select>";
        break;
    }
    return "<div class='form-group'><label class='col-xs-3  control-label'>" + field.label + "</label><div class='col-xs-6'>" + temp + "</div></div>");
  }
  Editor.prototype.open = function(action, rowData) {
    var self = this;
    this.isOpen = true;
    this.action = action;
    if(!this.isTemplate && (action == "edit" || action == "add")) {
      if(this.options.get("editor") && this.options.get("editor")["fields"]) {
        var fields = [];
        $.each(this.options.get("editor")["fields"], function(i, field) {
          fields.push(self.createField(field));
        });
        this.$modal.find("modal-body").html(fields.join(""));
      }
    }
    if(!this.isTemplate && action == "delete") {
      this.$modal.find(".modal-body").html("<div class='text-left'>确认删除该条记录？</div>");
    }
    if(this.isTemplate && action == "edit") {
      $.each(this.options.getEditor("fields"), function(i, field) {
        var pattern = field.data ? field.data : field.name;
        var d = rowData;
        if(typeof pattern == "string") {
          var keys = pattern.split(".");
          $.each(keys, function(a, key) {
            if(/^\[\d+\]$/.test(key)) {
              d = d[parseInt(key.replace(/[\[\]]/g, ""))];
            } else {
              d = d[key];
            }
          });
        } else if(typeof pattern == "function") {
          d = pattern(d);
        }
        self.$modal.find("[name='" + field.name + "']").val(d);
      });
    }
    //自定义事件
    if(typeof this.options.getEditor("onBeforeOpen") == "function") {
      this.options.getEditor("onBeforeOpen")(action, rowData);
    }
    if(!this.isTemplate) {
      $(".mask").show();
      self.$modal.show().find(".error").html("");
      self.$modal.removeClass("out").addClass("in");
    }
  }
  Editor.prototype.bindEvent = function() {
    var self = this;
    this.$modal.on("s.close", function() {
      self.$modal.removeClass("in").addClass("out");
      setTimeout(function() {
        self.$modal.hide();
        $(".mask").hide();
      }, 100);
    });
    this.$modal.on("click", ".close", function() {
      self.$modal.trigger("s.close");
    });
    this.$modal.on("click", "button.ok", function() {
     
    });
  }
  Editor.prototype.getParams = function() {
    
  }

  function Pagination(element, options) {
    this.$table = element;
    this.page = 1;
    this.pageSize = 10;
    this.pageList = [];
    this.count = 0;
    this.pageCount = 0;
    this.init(options);
    this.bindEvent();
  }
  Pagination.prototype.init = function(options) {
    this.pageSize = options.get("pageSize");
    this.pageList = options.get("pageList");

    this.$pageBar = $("<div class='pageBar'></div>");
    this.$table.after(this.$pageBar);
  }
  Pagination.prototype.loadData = function() {
    var instance = this.$table.data("simpleTable");
    instance.trigger("s.load");
  }
  Pagination.prototype.bindEvent = function() {
    var self = this;
    //绑定分页相关事件
    self.$pageBar.on("click", "li.page-number", function(){
      var num = $(this).attr("num");
      self.page = num;
      self.loadData();
    });
    self.$pageBar.on('click', "li.page-first", function(){
      if(this.className.indexOf("disabled") > -1) {
        return;
      }
      self.page = 1;
      self.loadData();
    });
    self.$pageBar.on('click', "li.page-last", function(){
      if(this.className.indexOf("disabled") > -1) {
        return;
      }
      self.page = self.pageCount;
      self.loadData();
    });
    self.$pageBar.on('click', "li.page-pre", function(){
      if(this.className.indexOf("disabled") > -1) {
        return;
      }
      self.page--;
      self.loadData();
    });
    self.$pageBar.on('click', "li.page-next", function(){
      if(this.className.indexOf("disabled") > -1) {
        return;
      }
      self.page++;
      self.loadData();
    });
    self.$pageBar.on('change', "select[name='pageSize']", function() {
      var pageSize = $(this).val();
      self.page = 1;
      self.pageSize = pageSize;
      self.loadData();
    });
  }
  Pagination.prototype.getParams = function() {
    return {
      offset: (this.page - 1) * this.pageSize,
      limit: this.pageSize
    }
  }
  Pagination.prototype.update = function(data) {
    this.count = data.count;
    var self = this;
    var linkCount = 6,
        startLink = 0,
        endLink = 0;
    var pageCount = Math.ceil(self.count / self.pageSize);
    self.pageCount = pageCount;
    if(pageCount <= linkCount) {
      startLink = 1;
      endLink = pageCount;
    } else {
      startLink = self.page - Math.floor(linkCount / 2 ) < 1 ? 1 : self.page - Math.floor(linkCount / 2);
      endLink = startLink + linkCount - 1;
      if(endLink > pageCount) {
        endLink = pageCount;
        startLink = endLink - linkCount + 1;
      }
    }
		var html = [];
		html.push("<div class='pull-left'>");
		html.push("<ul class='pagination' style='margin:0'>");
		html.push("<li class='page-first'><a href='javascript:void(0)'>&lt;&lt;</a></li>");
		html.push("<li class='page-pre'><a href='javascript:void(0)'>&lt;</a></li>");
		for(var i = startLink;i <= endLink;i++) {
			html.push("<li num='" + i + "' class='page-number " + (i == self.page ? "active" : "") + "'><a href='javascript:void(0)'>" + i + "</a></li>");
		}
		html.push("<li class='page-next'><a href='javascript:void(0)'>&gt;</a></li>");
		html.push("<li class='page-last'><a href='javascript:void(0)'>&gt;&gt;</a></li>");
		html.push("</ul></div>");
		var $link = $(html.join(""));
		if(self.page == 1) {
			$link.find(".page-first,.page-pre").addClass("disabled");
		} 
		if(self.page == pageCount) {
			$link.find(".page-last,.page-next").addClass("disabled");
		}
		html = [];
		html.push("<div class='pull-right form-inline'>");
		html.push("共   " + self.count + " 条数据,共 " + self.pageCount + " 页,每页显示 ");
		html.push("<select name='pageSize' class='form-control'>");
		for(var i = 0;i < self.pageList.length;i++) {
			html.push("<option value='" + self.pageList[i] + "'>" + self.pageList[i] + "</option>");
		}
		html.push("</select>")
		html.push("</div>")
		var $detail = $(html.join(""));
		$detail.find("select").find("[value='" + self.pageSize + "']").attr("selected", "selected");
		self.$pageBar.html("").append($link).append($detail);
  }

  function Options(opts) {
    this.options = $.extend(true, this.DEFAULT, opts);
  }
  Options.prototype.get = function(name) {
    return this.options[name];
  }
  Options.prototype.getEditor = function(name) {
    if(this.options["editor"]) {
      this.options["editor"][name];
    } else {
      return undefined;
    }
  }
  Options.prototype.set = function(name, value) {
    this.options[name] = value;
  }
  Options.prototype.isCheckbox = function() {
    return this.options["editor"] && this.options["editor"]["checkbox"];
  }
  Options.prototype.loadAjax = function() {
    var defaultAjax = {
      type: "get",
      dataType: "json"
    }
    var ajax = this.options["ajax"];
    if(typeof ajax == "string") {
      ajax = $.extend(true, {}, defaultAjax, {url: ajax});
    } else if(typeof ajax == "function") {
      return false;
    } else {
      ajax = $.extend(true, {}, defaultAjax, ajax);
    }
    return ajax;
  }
  Options.prototype.DEFAULT = {
    pageSize: 10,
    pageList: [10, 20, 50],
    paging: true,
    colmuns: [],
    editor: {
      checkbox: false,
      ajaxUrl: {
        edit: "edit",
        create: "create",
        delete: "delete"
      },
      ajax:""
    },
    ajax: "",
    formateParams: function(action, params) {
      return $.extend(true, {}, {action: action}, params);
    },
    formateResult: function(action, data) {
      return data;
    }
  }

  window.SimpleTable = SimpleTable;
})(jQuery);