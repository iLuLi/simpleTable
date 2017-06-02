(function($, window){
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

  function createModal(title, button) {
    var modal = [];
    modal.push('<div id="s-modal" class="modal fade" tabindex="-1" role="dialog">');
    modal.push('<div class="modal-dialog" role="document">');
    modal.push('<div class="modal-content">');
    modal.push('<div class="modal-header">');
    modal.push('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
    modal.push('<h4 class="modal-title">' + title + '</h4>');
    modal.push('</div>');
    modal.push('<div class="modal-body">');
    modal.push('');
    modal.push('</div>');
    modal.push('<div class="modal-footer">');
    modal.push('<span class="error" style="color: red;margin-right: 20px;"></span>')
    modal.push('<button type="button" class="ok btn btn-primary">' + button + '</button>');
    modal.push('</div>');
    modal.push('</div>');
    modal.push('</div>');
    modal.push('</div>');
    return modal.join('');
  }

  function createMask() {
    return '<div class="modal-backdrop fade"></div>';
  }

  function transformColmuns(element) {
    return $.map($(element).find("thead th"), function(item) {
      return {
        style: null,
        text: $(item).text(),
        isEdit: false
      }
    });
  }
  function transformData(element) {
    return $.makeArray($(element).find("tbody tr")).map(function(row) {
      return $.makeArray($(row).find("td")).map(function(td) {
        return $(td).text();
      })
    })
  }


  function SimpleTable(element, options) {
    if(typeof options == 'string') {
      return;
    }
    
    this.options = $.extend({},$.fn.simpleTable.default,options);
    //自身属性
    var self = this;
    var _opt = this.options;
    this.element = element;
    this.pageBar = $("<div class='pageBar'></div>");
    this.colNames = _opt.colNames;
    this.page = 1;
    this.pageCount = 0;
    this.count = 0;
    this.pageSize = _opt.paging ? _opt.pageSize : -1;
    this.editData = {};
    //加载模态框
    this.modal = $(createModal());
    $("body").append(this.modal).append(this.mask);
    //绑定模态框事件
    var mask;
    this.modal.on("s.open", function(action) {
      
      mask = $(createMask());
      $("body").append(mask);
      mask.addClass("in");
      self.modal.show().find(".error").html("");
      self.modal.removeClass("out").addClass("in");
    });
    this.modal.on("s.close", function() {
      self.modal.removeClass("in").addClass("out");
      setTimeout(function() {
        self.modal.hide();
        mask.remove();
      }, 100);
    });
    this.modal.on("click", ".close", function() {
      self.modal.trigger("s.close");
    });
    this.modal.on("click", "button.ok", function() {
      self.modifyAjax.call(self, undefined, function() {
        self.loadData();
        self.modal.trigger("s.close");
      }, function(error){
        self.modal.find(".error").html(error); 
      })
    });
    //可编辑框
    this.element.on("dblclick", "td.s-inline-edit", function() {
      var tr = $(this).closest("tr");
      var row = self.row(tr);
      var tdIndex = tr.find("td").index(this);
      var model = self.options.colModel[tdIndex];
      if(self.element.find(".edit-filed").length == 0) {
        $(this).html("").append(self._renderEditFiled(model, row[model.data]));
      }
    });


    if(_opt.colNames.length == 0) {
      this.colNames = transformColmuns(this.element);
    } else {
      this.colNames = _opt.colNames;
      this.element.html(this._renderThead());
    }
    if(_opt.data.length == 0) {
      this.data = transformData(this.element);
    } 
    if(_opt.serverSide) {
      //加载数据
      this.loadData();
    }
    //渲染分页
    if(_opt.paging) {
      self.element.after(self.pageBar);
      this.element.on("s.pagination", function() {
        self._renderPagination.call(self);
      });
      //绑定分页相关事件
      self.pageBar.on("click", "li.page-number", function(){
        var num = $(this).attr("num");
        self.page = num;
        self.loadData();
      });
      self.pageBar.on('click', "li.page-first", function(){
        if(this.className.indexOf("disabled") > -1) {
          return;
        }
        self.page = 1;
        self.loadData();
      });
      self.pageBar.on('click', "li.page-last", function(){
        if(this.className.indexOf("disabled") > -1) {
          return;
        }
        self.page = self.pageCount;
        self.loadData();
      });
      self.pageBar.on('click', "li.page-pre", function(){
        if(this.className.indexOf("disabled") > -1) {
          return;
        }
        self.page--;
        self.loadData();
      });
      self.pageBar.on('click', "li.page-next", function(){
        if(this.className.indexOf("disabled") > -1) {
          return;
        }
        self.page++;
        self.loadData();
      });
      self.pageBar.on('change', "select[name='pageSize']", function() {
        var pageSize = $(this).val();
        self.page = 1;
        self.pageSize = pageSize;
        self.loadData();
      });
    }
  }
  SimpleTable.prototype._renderEditFiled = function(model, value) {
    var edit, self = this;
    var c = "edit-filed";
    switch(model.filedType) {
      case 'text':
      case 'password':
        edit = "<input class='form-control' value='" + value + "' name='" + model.filedName + "'>";

    }
    var $edit = $(edit).addClass(c);
    $edit.on('blur', function() {
      var tr = $(this).closest("tr");
      var td = $(this).parent();
      var filed = this;
      var row = self.row(tr);
      var obj = {};
      var name = $(this).attr("name");
      var value = $(this).val();
      obj[name] = value;
      $.extend(row, obj);
      self.editData = row;
      //触发更新事件
      self.modifyAjax.call(self, 'edit', function() {
        self.loadData();
      }, function(error){
        filed.blur();
        if(td.find("span.error").length == 0) {
          td.append("<span class='error'>" + error + "</span>"); 
        } else {
          td.find("span.error").html(error);
        }
        
      }, true);
    });
    return $edit;
  }
  SimpleTable.prototype.row = function(tr) {
    var self = this;
    var id = $(tr).attr("sid");
    if(id == undefined) {
      id = $(tr).parent().find("tr").index($(tr));
      return this.data[id];
    } else {
      for(var index = 0;index < self.data.length;index++) {
        if(this.data[index][this.options.id] == id) {
          return this.data[index];
        }
      }
    }
  }
  SimpleTable.prototype.edit = function(tr) {
    var data = this.row(tr);
    if(data) {
      var id = data[this.options.id];
      id = id == undefined ? data[0] : id;
      this.modal.data("id", id);
    }
    if(typeof this.options.customFiled == 'function') {
      this.modal.find("modal-content").html(this.options.customFiled());
    } else {
      this.defaultModal("edit", "编辑", "保存");
      for(var name in data) {
        if(data.hasOwnProperty(name)) {
          this.modal.find("[name='" + name +"']").val(data[name]);
        }
      }
    }
    this.openModal();
  }
  SimpleTable.prototype.add = function() {
    if(typeof this.options.customFiled == 'function') {
      this.modal.find("modal-content").html(this.options.customFiled());
    } else {
      this.defaultModal("add", "添加", "保存");
      for(var name in row) {
        if(row.hasOwnProperty(name)) {
          this.modal.find("[name='" + name +"']").val(row[name]);
        }
      }
    }
    this.openModal();
  }
  SimpleTable.prototype.delete = function(tr) {
    var data = this.row(tr);
    if(data) {
      var id = data[this.options.id];
      id = id == undefined ? data[0] : id;
      this.modal.data("id", id);
    }
    
    this.defaultModal("delete", "删除", "确定");
    this.openModal();
  }
  SimpleTable.prototype.modifyAjax = function(action, resolve, reject, inlineEdit) {
    var self = this;
    var data = this.modifyData(inlineEdit);
    var action = !!action ? action : this.modal.data("action");
    var ajaxOptions = {
      url: '',
      type: 'get',
      dataType: 'json'
    };
    $.extend(ajaxOptions, this.options.ajax[action + "Ajax"]);
    ajaxOptions["data"] = data;
    ajaxOptions["success"] = function(data) {
      var data = self.options.formateResult(action, data);
      if(data.success) {
        resolve(data);
      } else {
        reject(data.error);
      }
    }
    $.ajax(ajaxOptions);
  }
  SimpleTable.prototype.modifyData = function(inlineEdit) {
    var self = this;
    var data = {};
    if(typeof this.options.customData == 'function') {
      return this.options.customData();
    } else {
      var filedNames = this.options.colModel.map(function(model) {
        if(model.filedName) {
          return model.filedName;
        }
      });
      if(inlineEdit) {
        $.each(filedNames, function(i) {
          data[filedNames[i]] = self.editData[filedNames[i]]; 
        });
      } else {
        $.each(filedNames, function(i) {
          data[filedNames[i]] = self.modal.find("[name='" + filedNames[i] + "']").val(); 
        });
      }
      var id = self.modal.data("id");
      data[self.options.id] = id;
      return data;
    }
  }
  SimpleTable.prototype.draw = function(data) {
    
  }
  //编辑框生成
  SimpleTable.prototype.defaultModal = function(action, title, button) {
    this.modal.find(".modal-title").html(title);
    this.modal.find(".modal-footer button").html(button);
    if(action != "delete") {
      this.modal.find(".modal-body").html("<div class='form-horizontal text-right'>" + this._renderFiled() + "</div>");
    } else {
      this.modal.find(".modal-body").html("<div class='text-left'>确认删除该条记录？</div>");
    }
    this.modal.data("action", action);
  }
  SimpleTable.prototype.openModal = function() {
    //自定义事件
    this.options.beforeOpen && this.options.beforeOpen(this.modal.data("action"));
    this.modal.trigger("s.open");
  }
  SimpleTable.prototype._renderFiled = function() {
    if(!this.options.colModel) return;
    var self = this;
    var filed = [];
    filed = filed.concat(self.options.colModel.map(function(model) {
      if(model.filed) {
        var temp;
        switch(model.filedType) {
          case 'text':
          case 'password':
          case 'hidden':
            temp = "<input class='form-control' type='" + model.filedType + "' name='" + model.filedName + "'>";
            break;
          case 'select':
            temp = "<select class='form-control' name='" + model.filedName + "'>";
            temp += model.options.map(function(option) {
              return "<option value='" + option.value + "'>" + option.text + "</option>";
            }).join("");
            temp += "</select>";
            break;
        }
        return "<div class='form-group'><label class='col-xs-3  control-label'>" + model.filedLabel + "</label><div class='col-xs-6'>" + temp + "</div></div>";
      }
    }));
    return filed.join("");
  }
  SimpleTable.prototype.loadData = function () {
    var self = this;
    var loadAjax;
    var defaultAjax = {
      url: '',
      type: 'get',
      dataType: 'json'
    }
    if(typeof this.options.ajax == 'string') {
      loadAjax = $.extend(defaultAjax, {url: this.options.ajax});
    } else {
      loadAjax = $.extend(defaultAjax, this.options.ajax.loadAjax);
    }
    var params = {};
    if(this.pageSize > 0) {
      var offset = (this.options.page - 1) * this.options.pageSize + 1;
      var limit = this.options.pageSize;
      params = {offset: offset, limit: limit};
    }
    loadAjax['data'] = this.options.formateParams('load', params);
    loadAjax['success'] = function(data) {
      data = self.options.formateResult('load', data);
      self.data = data.list;
      self._renderTbody(data);
      self.count = data.count;
      self.element.trigger("s.pagination");
    }
    $.ajax(loadAjax);
  }
  SimpleTable.prototype._renderPagination = function() {
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
		for(var i = 0;i < self.options.pageList.length;i++) {
			html.push("<option value='" + self.options.pageList[i] + "'>" + self.options.pageList[i] + "</option>");
		}
		html.push("</select>")
		html.push("</div>")
		var $detail = $(html.join(""));
		$detail.find("select").find("[value='" + self.pageSize + "']").attr("selected", "selected");
    self.pageBar.html("");
		self.pageBar.append($link).append($detail);
    
  }
  SimpleTable.prototype._renderThead = function() {
    var thead = [];
    thead.push("<thead>");
    thead = thead.concat(this.colNames.map(function(col) {
      return "<th>" + col + "</th>";
    }));
    thead.push("</thead>");
    return thead.join("");
  }
  SimpleTable.prototype._renderTbody = function(data) {
    var self = this;
    if(this.colNames.length == 0) return;
    var tbody = [];
    if(this.options.colModel.length == 0) {
      tbody = data.list.map(function(row) {
        var r = [];
        r.push("<tr>");
        r = r.concat(row.map(function(col) {
          return "<td>" + col + "</td>";
        }));
        r.push("</tr>");
        return r.join('');
      })
    } else {
      tbody = data.list.map(function(row) {
        var r = [];
        var id_value = row[self.options.id];
        if(id_value !== undefined) {
          r.push("<tr sid='" + id_value + "'>");
        } else {
          r.push("<tr>")
        }
        r = r.concat(self.options.colModel.map(function(model) {
          var td = $("<td></td>");
          if(model.inlineEdit) {
            td.addClass("s-inline-edit");
          }
          var text;
          if(typeof model.render == 'function') {
            text = model.render(row[model.data]);
          } else {
            text = row[model.data];
          }
          td.html(text);
          return td.get(0).outerHTML;
        }));
        r.push("</tr>");
        return r.join('');
      });
    }
    if(this.element.find("tbody").length) {
      this.element.find("tbody").html(tbody.join(''));
    } else {
      this.element.append("<tbody>" + tbody.join('') + "</tbody");
    }
  }
  SimpleTable.prototype.error = function(error) {
    console.error(error);
  }
  $.fn.simpleTable = function(options) {
    return new SimpleTable(this, options);
  }

  $.fn.simpleTable.default = {
    serverSide: false,
    page: 1,
    pageSize: 10,
    pageList: [10, 20, 50],
    paging: true,
    id: "id",
    colNames: [],
    colModel: [],
    data: [],
    ajax: '',
    formateParams: function(action, params){
      return $.extend({}, {action: action}, params);
    },
    formateResult: function(action, data) {
      return data;
    }
  }
})(jQuery, window)