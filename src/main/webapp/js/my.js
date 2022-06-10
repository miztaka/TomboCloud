
var my = {
	//client_id : "503907923831.apps.googleusercontent.com",
	client_id : "726434013214-3ibkjv4qoqr5sksi5fvp5jubunkrmj8d.apps.googleusercontent.com",
	scopes: 'email profile openid https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install',
	tabTemplate: '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-close" role="presentation">Remove Tab</span></li>',
    tokenClient: null,
	jq: {
		editor: null,
		tabLabel: null,
		config: null // config dialog
	},
	tomboConfig: null, // Config object
	authorizer: null, // Authorizer object
	// Driveから取得したFileオブジェクトのハッシュ(キーはfileId=nodeId)
	files: [],
	activeNodeId: null,
	
	/**
	 * fileIdをキーにしたtombo.FileModelオブジェクトを保持
	 */
	tomboFiles: [],
	
	/**
	 * ファイル情報オブジェクトを取得します。なければ新規に作成します。
	 */
	getTomboFile: function(fileId) {
		var self = this;
		if (! self.tomboFiles[fileId]) {
			self.tomboFiles[fileId] = new tombo.FileModel(self.files[fileId], self.authorizer);
		}
		return self.tomboFiles[fileId];
	},
	
	/**
	 * ファイル情報オブジェクトを削除します。
	 */
	removeTomboFile: function(fileId) {
		var self = this;
		if (self.tomboFiles[fileId]) {
			var tomboFile = self.tomboFiles[fileId];
			if (tomboFile.binding) {
				tomboFile.binding.unbind();
			}
			if (tomboFile.panel) {
				tomboFile.panel.remove();
				tomboFile.tabLabel.remove();
				//self.jq.editor.tabs('refresh');
			}
			delete self.tomboFiles[fileId];
		}
	},
	
	/**
	 * 画面の初期化処理:
	 *  認証完了後に呼ばれます。
	 *  各種jqオブジェクトを準備します。
	 */
	init: function() {
		var self = this;
		tombo.Drive.authorizer = self.authorizer;
		
		// editor画面の初期化(裏でtabsを使っている)
		self.jq.editor = $('#editor').tabs().delegate("span.ui-icon-close", "click", function() {
			var panelId = $(this).closest("li").remove().attr("aria-controls");
	        $("#"+panelId).remove();
	        self.jq.editor.tabs("refresh");
		});
		self.jq.tabLabel = $('#tabLabel');
		
		// 設定画面(dialog) TODO
	    self.jq.config = $("#dialog-config").dialog({
	    	autoOpen: false,
	    	//height: 300,
	    	//width: 350,
	    	modal: false,
	    	/*
	      buttons: {
	        "Create an account": function() {
	          var bValid = true;
	          allFields.removeClass( "ui-state-error" );
	 
	          bValid = bValid && checkLength( name, "username", 3, 16 );
	          bValid = bValid && checkLength( email, "email", 6, 80 );
	          bValid = bValid && checkLength( password, "password", 5, 16 );
	 
	          bValid = bValid && checkRegexp( name, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter." );
	          // From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
	          bValid = bValid && checkRegexp( email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com" );
	          bValid = bValid && checkRegexp( password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );
	 
	          if ( bValid ) {
	            $( "#users tbody" ).append( "<tr>" +
	              "<td>" + name.val() + "</td>" +
	              "<td>" + email.val() + "</td>" +
	              "<td>" + password.val() + "</td>" +
	            "</tr>" );
	            $( this ).dialog( "close" );
	          }
	        },
	        Cancel: function() {
	          $( this ).dialog( "close" );
	        }
	      },
	      close: function() {
	        allFields.val( "" ).removeClass( "ui-state-error" );
	      }
	      */
	    });
	    
	    // 設定ファイルの読込
	    my.log("設定ファイルを読み込みます。");
	    self.tomboConfig = new tombo.Config(null, self.authorizer);
	    self.tomboConfig.init(function() {
	    	my.log("config load done: ");
	    	my.log(self.tomboConfig);
	    	if (! self.tomboConfig.config.rootFolderId) {
	    		// 未設定 -> config Dialogを開く
	    		self.openConfig();
	    	} else {
	    		self.tomboConfig.render(); // 設定反映
	    		self.renderTree();
	    	}
	    });
	},
	
	/**
	 * Drive形式のデータをjstreeのNode形式のデータに変換します。
	 */
	file2node: function(file) {
		file.parent = file.parents[0].id; 
		file.text = file.title;
		if (file.mimeType && file.mimeType.match(/folder$/)) {
			//file.icon = "folder";
			file.type = "folder";
			file.state = {
				opened: false,
				selected: false,
				disabled: false
			};
			file.children = true;
		} else {
			//file.icon = "file";
			file.type = "file";
			file.text = file.text.replace(/\.txt$/,"");
		}
		return file;
	},
	
	/**
	 * jstreeのレンダリングを行ないます。
	 */
	renderJsTree: function(rootNode) {
		var self = this;
	    $('#tree').jstree({
	        'core' : {
	            'data' : function(node, cb) {
	            	my.log("jstree.core.data:");
	            	my.log(node);
	            	if (node.id == '#') {
	            		cb.call(this, [rootNode]);
	            	} else {
	            		// 現ノードの全てのファイルをDriveから取得し、callbackにより再帰処理?
	            		tombo.Drive.retrieveAllFiles(node.id, function(files) {
		            		var children = [];
	            			for (var i=0; i<files.length; i++) {
	            				if (files[i].mimeType != "text/plain" && ! files[i].mimeType.match(/folder$/)) {
	            					continue;
	            				}
	            				children.push(self.file2node(files[i]));
	            				self.files[files[i].id] = files[i];
	            			}
	            			my.log(children);
	            			cb.call(this, children);
	            		});
	            	}
	            },
	            // イベント実行前の動作
	            'check_callback' : function(o, n, p, i, m) {
	            	
	            	if (o === "delete_node") {
	            		// ノード削除
	        	    	if (n.type == 'file') {
	        	    		if (! confirm('「' + n.text + '」をDriveから削除します。よろしいですか？')) {
	        	    			return false;
	        	    		}
	        	    	} else {
	        	    		// フォルダ
	        	    		if (! confirm('フォルダ「' + n.text + '」とその中身をDriveから削除します。本当によろしいですか？')) {
	        	    			return false;
	        	    		}
	        	    	}
	        	    	return true;
	            	}
	            	
	                if(m && m.dnd && m.pos !== 'i') { return false; }
	                if(o === "move_node" || o === "copy_node") {
	                    if(this.get_node(n).parent === this.get_node(p).id) { return false; }
	                }
	                return true;
	            },
	            'themes' : {
	                'responsive' : false,
	                'variant' : 'small',
	                'stripes' : false
	            }
	        },
	        // Folder、Fileの順。その中は名前順
	        'sort' : function(a, b) {
	        	var aObj = my.files[a];
	        	var bObj = my.files[b];
	        	if (! aObj) {
	        		return -1;
	        	}
	        	if (! bObj) {
	        		return 1;
	        	}
	        	if (this.get_type(a) === this.get_type(b)) {
	        		if (aObj.mimeType.match(/folder/)) {
	        			return (this.get_text(a) > this.get_text(b) ? 1 : -1); // Folderは名前順
	        		} else {
	        			return (aObj.modifiedDate < bObj.modifiedDate ? 1 : -1); // fileは新しい順
	        		}
	        	} else {
	        		return (this.get_type(a) >= this.get_type(b) ? -1 : 1); // Folder,Fileの順
	        	}
	        	//return this.get_type(a) === this.get_type(b) ? (this.get_text(a) > this.get_text(b) ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? -1 : 1);
	        	//return this.get_type(a) === this.get_type(b) ? (aObj.modifiedDate < bObj.modifiedDate ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? -1 : 1);
	        	//my.log(['sort:',a.icon,",",b.icon].join(""));
	        	//my.log(a);
	        	//return a.icon === b.icon ? (this.get_text(a) > this.get_text(b) ? 1 : -1) : (a.icon == 'folder' ? 1 : -1);
	        },
	        // 右クリックで開くメニュー
	        'contextmenu' : {
	            'items' : function(node) {
	                var tmp = $.jstree.defaults.contextmenu.items();
	                delete tmp.create.action;
	                tmp.create.label = "New";
	                tmp.create.submenu = {
	                    "create_folder" : {
	                        "separator_after"   : true,
	                        "label"             : "Folder",
	                        "action"            : function (data) {
	                            var inst = $.jstree.reference(data.reference),
	                                obj = inst.get_node(data.reference);
	                            inst.create_node(obj, { type : "default", text : "New folder" }, "last", function (new_node) {
	                                setTimeout(function () { inst.edit(new_node); },0);
	                            });
	                        }
	                    },
	                    "create_file" : {
	                        "label"             : "File",
	                        "action"            : function (data) {
	                            var inst = $.jstree.reference(data.reference),
	                                obj = inst.get_node(data.reference);
	                            inst.create_node(obj, { type : "file", text : "New file" }, "last", function (new_node) {
	                                setTimeout(function () { inst.edit(new_node); },0);
	                            });
	                        }
	                    }
	                };
	                if(this.get_type(node) === "file") {
	                    delete tmp.create;
	                }
	                delete tmp.ccp; // TODO Cut,Copy,PasteメニューをOFF
	                return tmp;
	            }
	        },
	        'types' : {
	            'default' : { 'icon' : 'folder' },
	            'folder' : { 'icon': 'folder' },
	            'file' : { 'valid_children' : [], 'icon' : 'file' }
	        },
	        'plugins' : ['state','dnd','sort','types','contextmenu','unique']
	    })
	    // ノードの削除 
	    .on('delete_node.jstree', function (e, data) {
	    	
	    	if (data.node.type == 'file') {
	    		// unbind
	    		self.removeTomboFile(data.node.id);
	    	}
	    	// file,folder共通 ドライブからファイルを削除
    		tombo.Drive.deleteFile(data.node.id, function(resp) {
    			if (resp) {
    				alert("「" + data.node.text + "」を削除しました。");
    			} else {
    				alert("Driveファイルの削除に失敗しました。");
    			}
    		});
	    })
	    // ノードの作成(ファイルorフォルダ)
	    .on('create_node.jstree', function (e, data) {
	    	
	    	// driveにファイル作成
	    	if (data.node.type == 'file') {
	    		// 名前を決めてからファイル作成
	    		data.instance.set_id(data.node, "NEWFILE");
	    	} else {
	    		// drive api create 
	    		var newFolder = {
	    			"title": "New Folder",
	    			"parents": [ { "id": data.parent } ],
	    			"mimeType": "application/vnd.google-apps.folder"
	    		};
	    		tombo.Drive.insertFile(newFolder, function(resp) {
	    			console.log("create folder:");
		    		console.log(resp);
		    		if (resp.id) {
				    	// 成功時はIDセット
		    			data.instance.set_id(data.node, resp.id);
		    			self.files[resp.id] = resp;
		    		} else {
		    			// IDがなければ失敗とみなす？ FIXME
		    			data.instance.refresh();
		    		}
	    		});
	    	}
	    	/*
	        $.get('jtree/demo/filebrowser/index.php?operation=create_node', { 'type' : data.node.type, 'id' : data.node.parent, 'text' : data.node.text })
	            .done(function (d) {
	            	data.instance.set_id(data.node, d.id);
	            })
	            .fail(function () {
	                data.instance.refresh();
	            });
	            */
	    })
	    // ノードのリネーム
	    .on('rename_node.jstree', function (e, data) {
	    	my.log('rename_node: ' + data.node.id + " " + data.text);
	    	my.log(data);
	    	if (data.node.id == "NEWFILE") {
	    		//新規ファイル作成
	    		var newFile = {
	    			"title": data.text + ".txt",
	    			"text": data.text,
	    			"parents": [ { "id": data.node.parent } ],
	    			"mimeType": "text/plain"
		    	};
	    		tombo.Drive.insertFile(newFile, function(resp) {
		    		console.log("create file:");
			    	console.log(resp);
			    	if (resp.id) {
					   	// 成功時はIDセット
			    		data.instance.set_id(data.node, resp.id);
			    		self.files[resp.id] = resp;
			    		// タブ作成
			    		self.openFile(data.node);
			    	} else {
			    		// IDがなければ失敗とみなす？ FIXME
			    		data.instance.refresh();
			    	}
		    	});
		    	return;
	    	}
	    	
	    	var file = self.files[data.node.id];
	    	if (! file) {
	    		alert("ファイルが存在しません。");
	    		data.instance.refresh();
	    		return;
	    	}
	    	var updated = {
	    		fileId: data.node.id,
	    		title: data.text
	    	};
	    	if (data.node.type == 'file') {
	    		updated.title += ".txt";
	    		updated.text = data.text;
	    	}
	    	tombo.Drive.updateFile(updated, function(resp) {
    			my.log("file rename:");
	    		my.log(resp);
	    		if (resp.id) {
			    	// 成功時はデータ更新
	    			self.files[resp.id] = resp;
	    		} else {
	    			// IDがなければ失敗とみなす？ FIXME
	    			data.instance.refresh();
	    		}
    		});
	    })
	    // ノードの移動
	    .on('move_node.jstree', function (e, data) {
	    	my.log("move_node.jstree");
	    	my.log(data);
	    	tombo.Drive.moveFile(data.node.id, data.old_parent, data.parent, function(resp) {
	    		my.log("drive move done:");
	    		my.log(resp);
	    	});
	    	/*
	        $.get('jtree/demo/filebrowser/index.php?operation=move_node', { 'id' : data.node.id, 'parent' : data.parent })
	            .done(function (d) {
	                //data.instance.load_node(data.parent);
	                data.instance.refresh();
	            })
	            .fail(function () {
	                data.instance.refresh();
	            });
	            */
	    })
    	/*
	    .on('copy_node.jstree', function (e, data) {
	        $.get('jtree/demo/filebrowser/index.php?operation=copy_node', { 'id' : data.original.id, 'parent' : data.parent })
	            .done(function (d) {
	                //data.instance.load_node(data.parent);
	                data.instance.refresh();
	            })
	            .fail(function () {
	                data.instance.refresh();
	            });
	    })
        */
	    // ノードが選択された時の処理
	    .on('changed.jstree', function (e, data) {
	    	my.log("changed.jstree:");
	    	my.log(data);
	    	if (data.node && data.node.type == 'file') {
	    		if (data.action == 'select_node' && data.node.id != "NEWFILE") {
	    			self.openFile(data.node);
	    		}
	    	} else {
	    		// フォルダ開閉
	    		data.instance.toggle_node(data.node);
	    	}
	    });
	},
	
	/**
	 * ファイルを開く
	 * 　既にタブとして読み込まれているものはそれを表示
	 * 　取得していない場合はRealTimeAPIのModelを作ってbind
	 */
	openFile: function(node) {
		var self = this;
		$("head title").text(self.files[node.id].text);
		self.activeNodeId = node.id;
		my.log("openFile:");
		my.log(node);
		
		var tomboFile = self.getTomboFile(node.id);
		my.log("tomboFile:");
		my.log(tomboFile);
		if (! tomboFile.isLoaded) {
			self.jq.tabLabel.append(tomboFile.tabLabel);
			self.jq.editor.append(tomboFile.panel);
			self.jq.editor.tabs("refresh");
			tomboFile.loadModel(function(jqTextArea) {
				// カーソル位置復元
				var pos = self.tomboConfig.getCursorPosition(node.id);
				if (pos) {
					self.setCaretPosition(jqTextArea.get(0), pos);
				}
			});
		}
		tomboFile.tabLabel.find('a').click();
		//self.jq.tabLabel.find('a[href="#'+tabid+'"]').click();
	},
	
	/**
	 * アクティブパネルのコンテンツをSaveする
	 */
	saveFile: function() {
		var self = this;
		if (self.activeNodeId) {
			var tomboFile = self.getTomboFile(self.activeNodeId); 
			var content = tomboFile.getContent();
			var targetFile = self.files[self.activeNodeId];
			tombo.Drive.saveFile(targetFile, content, function(file) {
		    	if (file) {
		    		toastr.success("保存しました。");
		    	} else {
		    		toastr.error("保存に失敗しました。");
		    	}
			});
			// カーソル位置を保存
			var pos = self.getCaretPosition(tomboFile.textarea.get(0));
			self.log("cursor position: " + pos);
			self.tomboConfig.saveCursorPosition(self.activeNodeId, pos);
		}
	},
	
	/**
	 * 全てのRealTimeデータを保存する
	 */
	backupFile: function() {
		var self = this;
		var folderId = '1uRnwYObrBl49FBuqFajukZ7Hm4_YWOh5';
		for(var k in self.files) {
			if(self.files.hasOwnProperty(k)) {
				my.log("バックアップ開始:" + k);
				var tomboFile = self.getTomboFile(k);
				if (! tomboFile.isLoaded) {
					tomboFile.loadModel(function(jqTextArea) {
						if (tomboFile.content) {
							// Driveにセーブする
				    		var bkFile = {
				    			"title": k + ".txt",
				    			"text": "Realtimeデータのバックアップ:" + k,
				    			"parents": [ { "id": folderId } ],
				    			"mimeType": "text/plain"
					    	};
				    		tombo.Drive.insertFile(bkFile, function(resp) {
						    	if (resp.id) {
						    		// コンテンツをアップロード
									tombo.Drive.saveFile(resp, tomboFile.content, function(file) {
								    	if (file) {
								    		my.log("バックアップ完了:" + bkFile.title);
								    	} else {
								    		my.log("バックアップ失敗:" + bkFile.title);
								    	}
									});						
						    	} else {
						    		my.log("INERT失敗: " + k);
						    	}
				    		});
						}
					});
				} else {
					my.log("ロード済:おかしいな:" + k);
				}
			}
		}
	},
	
	/**
	 * undo
	 */
	undo: function() {
		var self = this;
		if (self.activeNodeId) {
			var model = self.getTomboFile(self.activeNodeId).model;
			if (model && model.canUndo) {
				model.undo();
			}
		}
	},
	
	redo: function() {
		var self = this;
		if (self.activeNodeId) {
			var model = self.getTomboFile(self.activeNodeId).model;
			if (model && model.canRedo) {
				model.redo();
			}
		}
	},
	
	byteCount: function(s) {
	    return encodeURI(s).split(/%..|./).length - 1;
	},
	
	/**
	 * フォルダツリーをレンダリングします
	 */
	renderTree: function() {
		var self = this;
		var rootId = self.tomboConfig.config.rootFolderId;
		if (! rootId) {
			alert("ルートフォルダが設定されていません。");
			return;
		}
		var rootNode = null;
		tombo.Drive.getFile(rootId, function(resp) {
			rootNode = {
				id: rootId,
				text: resp.title,
				icon: "folder",
				state: { opened: true },
				children: true
			};
			self.tomboConfig.setRootFileName(resp.title);
			self.renderJsTree(rootNode);
		});
	},
	
	openConfig: function() {
		var self = this;
		self.jq.config.dialog("open");
	},
	
	insertTimestamp: function() {
		var self = this;
		var template = '********* yyyy/MM/dd *********';
		if (self.activeNodeId) {
			var dom = self.getTomboFile(self.activeNodeId).textarea.get(0);
			var pos = self.getCaretPosition(dom);
			var format = new DateFormat(template);
			var datestr = format.format(new Date());
			datestr += "\n";
			self.insertTextAtPosision(dom, pos, datestr);
		}
	},
	
	/**
	 * 指定された位置にテキストを挿入
	 */
	insertTextAtPosision: function(obj, pos, txt) {
	    obj.focus();
	    if (jQuery.browser.msie) {
	        pos.text = txt;
	        pos.select();
	    } else {
	        var s = obj.value;
	        var np = pos + txt.length;
	        obj.value = s.substr(0, pos) + txt + s.substr(pos);
	        obj.setSelectionRange(np, np);
	    }
	},
	
	/**
	 * カーソル位置を取得
	 */
	getCaretPosition: function(obj) {
	    obj.focus();
	    var pos;
	    if (jQuery.browser.msie) {
	        pos = document.selection.createRange();
	    } else {
	        pos = obj.selectionStart;
	    }
	    return pos;
	},
	
	/**
	 * カーソル位置を移動
	 */
	setCaretPosition: function(elm, pos) {
		
		$(elm).caretPos(pos);
		/*
		elm.focus();
		if (elm.createTextRange) {
		  var range = elm.createTextRange();
		  range.move('character', pos);
		  range.select();
		} else if (elm.setSelectionRange) {
		  elm.setSelectionRange(pos, pos);
		}
		*/
	},
	
	/**
	 * ログ出力
	 */
	log: function(str) {
		if (console) {
			console.log(str);
		}
	}
	
};

/**
 * @namespace Tombo application namespace
 */
var tombo = tombo || {};

/*
 * ======================== object Drive ==============================
 */

/**
 * Drive operation
 */
tombo.Drive = {
	loaded: false,
	authorizer: null,
	
	/**
	 * 指定されたDriveファイルのコンテンツを読み込みます。
	 * 
	 * @param file DriveのFileオブジェクト
	 * @param onLoad 引数にXMLHttpRequestオブジェクトを渡します。
	 */
	loadFile: function(file, onLoad) {
		var self = this;
		self.assertLibraryLoaded();
		my.log("loadFile called...");
		if (file.downloadUrl) {
			if (! self.authorizer.isValid()) {
				self.authorizer.doRefreshToken(function() {
					self.loadFile(file, onLoad);
				});
				return;
			}
		    var accessToken = this.authorizer.authResult.access_token;
		    var xhr = new XMLHttpRequest();
		    my.log(file.downloadUrl);
		    xhr.withCredentials = true;
		    xhr.open('GET', file.downloadUrl.replace('content.google','www.google'));
		    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
		    xhr.onload = function() {
		    	onLoad(xhr);
		    };
		    xhr.onerror = function() {
		    	onLoad(null);
		    };
		    xhr.send();
		} else {
			onLoad(null);
		}
	},
	
	/**
	 * Driveのファイル内容を指定されたコンテンツ(text)で保存します。
	 * 
	 * @param file
	 * @param contents
	 * @param onLoad Driveのfileオブジェクトを引数に渡します。
	 */
	saveFile: function(file, contents, onLoad) {
		this.assertLibraryLoaded();
	    var request = gapi.client.request({
	        'path': '/upload/drive/v2/files/' + file.id,
	        'method': 'PUT',
	        'params': {'uploadType': 'media'},
	        'headers': {
	          'Content-Type': file.mimeType
	          //'Content-Length': self.byteCount(content)
	        },
	        'body': contents
	    });
	    request.execute(function(file) {
	    	onLoad(file);
	    });
	},
	
	/**
	 * 指定されたタイトルのDriveFileを取得します。
	 * 
	 * @param title
	 * @param callback 取得できた場合はfileオブジェクトを引数に渡します。
	 */
	findByTitle: function(title, callback) {
		this.assertLibraryLoaded();
		
		gapi.client.drive.files.list({
			q:"title = '" + title + "'"
		}).execute(function(resp) {
			my.log("Config#load:");
			my.log(resp);
			if (resp.items && resp.items.length) {
				callback(resp.items[0]);
			} else {
				callback(null);
			}
		});
	},
	
	/**
	 * Driveに新しいファイルを作成します。メタのみ
	 *
	 * @param newFile
	 * @param callback
	 */
	insertFile: function(newFile, callback) {
		this.assertLibraryLoaded();	
		gapi.client.drive.files.insert(newFile).execute(function(resp) {
			callback(resp);
		});
	},
	
	/**
	 * Driveのファイル情報を更新します。メタのみ
	 * @param updateFile
	 * @param callback
	 */
	updateFile: function(updateFile, callback) {
		this.assertLibraryLoaded();
    	gapi.client.drive.files.update(updateFile).execute(function(resp) {
    		callback(resp);
    	});
	},
	
	/**
	 * 指定されたファイルIDのファイルを取得します。メタのみ
	 * @param fileId
	 * @param callback
	 */
	getFile: function(fileId, callback) {
		this.assertLibraryLoaded();
		gapi.client.drive.files.get({fileId: fileId}).execute(function(resp) {
			callback(resp);
		});
	},
	
	/**
	 * 指定されたrootId配下のファイルを全てDriveから取得します。
	 *  全件取得後にcallbackを呼び出します。
	 */
	retrieveAllFiles: function(rootId, callback) {
		this.assertLibraryLoaded();
		var retrievePageOfFiles = function(request, result) {
			request.execute(function(resp) {
				result = result.concat(resp.items);
				my.log(result);
				var nextPageToken = resp.nextPageToken;
				if (nextPageToken) {
					request = gapi.client.drive.files.list({
						'pageToken': nextPageToken
			        });
			        retrievePageOfFiles(request, result);
				} else {
			        callback(result);
				}
			});
		};
		var initialRequest = gapi.client.drive.files.list({
			q:"'"+rootId+"' in parents and trashed=false" 
		});
		retrievePageOfFiles(initialRequest, []);
	},
	
	/**
	 * driveファイルの削除
	 */
	deleteFile: function(fileId, callback) {
		
		gapi.client.drive.files.trash({
			'fileId': fileId
		}).execute(function(resp) {
			if (callback) {
				callback(resp);
			}
		});
	},
	
	/**
	 * フォルダの移動
	 * @param fileId
	 * @param folderFrom
	 * @param folderTo
	 * @param callback
	 */
	moveFile: function(fileId, folderFrom, folderTo, callback) {
		
		gapi.client.drive.files.update({
			fileId: fileId,
			addParents: folderTo,
			removeParents: folderFrom
		}).execute(function(resp) {
			if (callback) {
				callback(resp);
			}
		});
	},
	
	/**
	 * drive apiのライブラリが読み込まれていることをチェック
	 */
	assertLibraryLoaded: function() {
		if (! this.loaded) {
			alert("ライブラリが読み込まれていません。");
			throw new Error("ライブラリが読み込まれていません。");
		}
	}
		
};

/*
 * ========================== class Authorizer ====================================== 
 */

/**
 * Creates a new Authorizer
 * @constructor
 * @param clientId
 * @param scopes
 */
tombo.Authorizer = function(clientId, scopes) {
	this.clientId = clientId;
	this.scopes = scopes;
	this.authDialog = null;
	this.timer = null;
	this.authResult = null;
	this.googleUser = null;
};

/**
 * 認証を行ないます
 * @param immediate_flg
 * @param onAuthComplete 引数なしで呼び出されるコールバック
 */
tombo.Authorizer.prototype.authorize = function(immediate_flg, onAuthComplete) {
	var self = this;
	
	/*
	gapi.auth.authorize({
    	client_id: this.clientId,
    	scope: this.scopes,
    	immediate: immediate_flg
    }, function(authResult) {
        if (authResult && !authResult.error) {
        	self.onAuthSuccess(authResult, onAuthComplete);
        } else {
        	self.onUnauthorized(authResult, onAuthComplete);
        }
    });
    */
	
    var auth = gapi.auth2.init({
        client_id: self.clientId
    });
    my.log("auth2.init...");
    
    auth.then(function() {
        // after init
        my.log("then...");
        //auth = gapi.auth2.getAuthInstance();
        if (auth.isSignedIn.get() == true) {
            my.log("signed in.");
            self.googleUser = auth.currentUser.get();
            var authResult = self.googleUser.getAuthResponse();
            if (authResult.access_token) {
            	self.onAuthSuccess(authResult, onAuthComplete);
            } else {
            	self.googleUser.reloadAuthResponse().then(function(authResult) {
            		my.log("reloadAuthResponse:");
            		my.log(authResult);
            		self.onAuthSuccess(authResult, onAuthComplete);
            	});
            }
        } else {
            my.log("not signed in.");
            auth.isSignedIn.listen(function(bool) {
                if (bool) {
                    my.log("changed to signed in.");
                    self.googleUser = auth.currentUser.get();
                    self.onAuthSuccess(self.googleUser.getAuthResponse(), onAuthComplete);
                } else {
                    alert("signin failed.");
                }
            })
            my.log("try to sign in.....");
            self.onUnauthorized(null, onAuthComplete);
        }
    });	
};

/**
 * 認証されていない時の処理
 * ダイアログを開いてログインを実行してもらう
 * 
 * @param authResult
 * @param onAuthComplete
 */
tombo.Authorizer.prototype.onUnauthorized = function(authResult, onAuthComplete) {
	var self = this;
	
    // ダイアログを開いてDriveにログインしてもらう
	if (! self.authDialog) {
		self.authDialog = $('#dialog-auth');
	} else {
		self.authDialog.html("");
	}
	gapi.signin2.render("dialog-auth", {scope: self.scopes});
	
	/*
	$('<a href="#">Driveにログイン</a>').appendTo(self.authDialog).click(function(e) {
		e.preventDefault();
		self.authorize(false, onAuthComplete);
		self.authDialog.html("<p>認証しています...</p>");
	});
	*/
	self.authDialog.dialog();
};

/**
 * OAuth認証成功後の処理
 * refreshTokenのタイマーをしかけてからコールバックを実行する
 * 
 * @param authResult
 * @param onAuthComplete
 */
tombo.Authorizer.prototype.onAuthSuccess = function(authResult, onAuthComplete) {
	var self = this;

	// ダイアログが開いていれば閉じる
	if (self.authDialog) {
		self.authDialog.dialog("close");
	}
	
	my.log("onAuthSuccess called. authResult: ");
	my.log(authResult);
	self.authResult = authResult;
	gapi.auth.setToken(authResult);
    self.expires_at = Date.now() + (authResult.expires_in-60)*1000;
	
	// refreshタイマー
	var exp_time = (self.authResult.expires_in - 120)*1000;
	if (self.timer) {
		clearTimeout(self.timer);
	}
	self.timer = setTimeout(function() {
		my.log("timeout timer:");
		self.doRefreshToken();
	}, exp_time);
	
	// exec callback
	if (onAuthComplete) {
		onAuthComplete();
	}
};

/**
 * expireの直前に再帰的に認証を呼び出す処理
 */
tombo.Authorizer.prototype.doRefreshToken = function(cb) {
	var self = this;

	my.log("doRefreshToken called.");
    if (confirm("アクセストークンを再取得しますか？")) {
        my.tokenClient.callback = function(response) {
            if (response && response.access_token) {
                self.onAuthSuccess(response, cb);
            }
        };
        my.tokenClient.requestAccessToken({prompt:''});
    }
};

/**
 * アクセストークンが有効かどうか
 */
tombo.Authorizer.prototype.isValid = function() {
	var self = this;
	var exp_time = self.expires_at - 60*1000;
	my.log("exp_time:" + new Date(exp_time));
	return exp_time > Date.now();
}

/*
 * ========================== class Config ====================================== 
 */

/**
 * create tombo Config class
 * @constructor
 */
tombo.Config = function(configJq, authorizer) {
	this.configFile = null;
	this.rootFileName = null;
	this.pickerInstance = null;
	this.configJq = configJq;
	this.config = {
		rootFolderId: null,
		bgcolor: 'ffffff',
		pos: {}
	};
	this.authorizer = authorizer;
};
tombo.Config.prototype.CONFIG_FILENAME = "__TomboConfig.json";

/**
 * set root filename
 * @param filename
 */
tombo.Config.prototype.setRootFileName = function(filename) {
	this.rootFileName = filename;
	this.render();
};

/**
 * render config form
 */
tombo.Config.prototype.render = function() {
	$('#openRootFolderChoice', this.configJq).text(this.rootFileName);
	if (this.config.bgcolor != null) {
		$("body").css("background-color", "#"+this.config.bgcolor);
	}
	return;
};

/**
 * root folder selected
 */
tombo.Config.prototype.onSelected = function(folder) {
	this.setRootFileName(folder.title);
	if (this.config.rootFolderId != folder.id) {
		if (confirm("ルートフォルダが変更されました。画面をリロードします。よろしいですか？")) {
			// save config & reload location
			this.config.rootFolderId = folder.id;
			this.persist(function(file) {
				if (file) {
					window.location.reload();
				} else {
					alert("設定ファイルの保存に失敗しました。");
				}
			});
			
		}
	}
};

/**
 * load config from drive.
 * @param onLoadComplete {Function} to call once configuration has been loaded.
 */
tombo.Config.prototype.init = function(onLoadComplete) {
	
	var self = this;
	
	/**
	 * this section sets event
	 */
	
    // google picker
    $('#openRootFolderChoice').click(function() {
		if (! self.pickerInstance) {
			gapi.load('picker', function() {
                var docsView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
                    .setSelectFolderEnabled(true);
                self.pickerInstance = new google.picker.PickerBuilder()
                    //.enableFeature(google.picker.Feature.NAV_HIDDEN)
                    .enableFeature(google.picker.Feature.MINE_ONLY)
                    .setLocale('ja')
                    .setAppId(my.client_id)
                    .setOAuthToken(self.authorizer.authResult.access_token)
                    //.setAuthUser(MY.X.UserEmail)
                    .setCallback(function(data) {
                        if (data.action == google.picker.Action.PICKED) {
                            var selectedFolder = data.docs[0];
                            self.onSelected(selectedFolder);
                        }
                    })
                    .addView(docsView)
                    .build();
            });
		}
		self.pickerInstance.setVisible(true);    	
    });
    
    // colpick
    $("#bgColor").colpick({ 
    	color: self.config.bgcolor,
    	onSubmit: function(HSB,HEX,RGB,el) {
    		my.log("bgcolor selected: " + HEX);
    		// 背景色をセットする
    		self.config.bgcolor = HEX;
    		self.render();
    		self.persist();
    		return true;
    	}
    });

    /*
     * 設定ファイルをロードする
     */
    tombo.Drive.findByTitle(self.CONFIG_FILENAME, function(file) {
    	if (file) {
			self.configFile = file;
			// ファイル内容読込
			tombo.Drive.loadFile(file, function(xhr) {
				my.log("loadDriveFile:");
				my.log(xhr);
				if (xhr && xhr.responseText) {
					var configObj = JSON.parse(xhr.responseText);
					my.log("JSON parse done:");
					my.log(configObj);
					self.config.rootFolderId = configObj.rootFolderId;
					self.config.bgcolor = configObj.bgcolor;
					self.config.pos = configObj.pos || {};
					onLoadComplete();
				} else {
					// ファイルが空
					my.log("empty config file....");
					onLoadComplete();
				}
			});
    	} else {
			// ファイル新規作成
    		var newFile = {
    			"title": self.CONFIG_FILENAME,
    			"text": self.CONFIG_FILENAME,
    			"mimeType": "application/json"
	    	};
    		tombo.Drive.insertFile(newFile, function(resp) {
	    		console.log("create new config file:");
		    	console.log(resp);
		    	if (resp.id) {
				   	// 成功
		    		self.configFile = resp;
		    		onLoadComplete();
		    	} else {
		    		// 失敗
		    		alert("設定ファイルを作成できませんでした。ブラウザをリロードして再度お試しください。");
		    	}
    		});
    	}
    });
	
};

/**
 * カーソル位置を保存する
 * 
 * @param id ファイルID
 * @param pos カーソル位置
 */
tombo.Config.prototype.saveCursorPosition = function(id, pos) {
	var self = this;
	self.config.pos[id] = pos;
	self.persist();
};

/**
 * カーソル位置を取得する
 * @param id
 * @returns
 */
tombo.Config.prototype.getCursorPosition = function(id) {
	return this.config.pos[id] || null;
};

/**
 * 設定ファイルをDriveに保存します。
 * 
 * @param callback
 */
tombo.Config.prototype.persist = function(callback) {
	
	var contents = JSON.stringify(this.config);
	my.log(contents);
	tombo.Drive.saveFile(this.configFile, contents, function(file) {
		if (callback) {
			callback(file);
		}
	});
};


/*
 * ========================== class FileModel ====================================== 
 */

/**
 * TomboアプリケーションのFileを表すモデルクラスです。
 * RealTimeAPIのモデルやEditorのJQオブジェクトなどを保持します。
 * @constructor
 */

tombo.FileModel = function(file, authorizer) {
	
	var tabTemplate = '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-close" role="presentation">Remove Tab</span></li>';
	
	this.isLoaded = false;
	this.file = file;
	this.authorizer = authorizer;
	this.tabId = "tabs-" + file.id;
	this.model = null;
	this.binding = null;
	this.panel = $("<div/>").attr("id", this.tabId).addClass("fix-width").addClass("fix-height");
	this.tabLabel = $(tabTemplate.replace(/#\{href\}/g, "#" + this.tabId).replace(/#\{label\}/g, file.text));
	this.textarea = null;
	this.content = null; // 移行用
};

/**
 * Driveからファイルコンテンツを取得します。
 * RealTimeAPIのモデルとbindします。
 * @param afterThat Drive読み込み成功後のコールバック jqTextAreaを渡す
 */
tombo.FileModel.prototype.loadModel = function(afterThat) {
	
	var self = this;
	my.log("loadModel: ");
	my.log(self.file);
	var onResult = function(txt) {
		if (! txt) {
			self.panel.html("<p>ファイルを読み込めませんでした。しばらくして再度お試しください。</p>");
		} else {
			self.isLoaded = true;
			self.textarea = $('<textarea class="fix-width fix-height"></textarea>');
			self.textarea.appendTo(self.panel);
			self.textarea.val(txt);
			//self.binding = gapi.drive.realtime.databinding.bindString(collaboString, self.textarea.get(0));
			// callback
			if (afterThat) {
				afterThat(self.textarea);
			}
		}
	};
	if (self.file.downloadUrl) {
		tombo.Drive.loadFile(self.file, function(xhr) {
			if (xhr) {
		    	var txt = xhr.responseText ||  self.file.title.replace(/\.txt$/,"");
		    	self.content = txt;
		    	// var stringModel = self.model.createString(txt);
		    	// self.model.getRoot().set('tombo.text', stringModel);
		    	onResult(self.content);
			} else {
				onResult(null);
			}
		});
	} else {
		onResult(null);
	}
};

/**
 * 編集中のコンテンツ内容を取得します。
 */
tombo.FileModel.prototype.getContent = function() {
	return this.textarea.val();
};
