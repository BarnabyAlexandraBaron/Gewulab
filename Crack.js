// ==UserScript==
// @name         有一个人前来买瓜
// @namespace    http://iik.moe/
// @version      2.0
// @description  never thought to crack
// @author       这瓜不保熟   QQ：3561812864
// @match        http://www.gewulab.com/test/*/show
// @include      http://www.gewulab.com/test/*/result
// @grant        none
// @require      https://cdn.staticfile.org/jquery/3.3.1/jquery.min.js
// @require      http://gewulab.com/bundles/topxiaweb/js/controller/quiz-question/report/float.js?v7.5.23
// @require      http://gewulab.com/bundles/topxiaweb/js/controller/quiz-question/report/judge.js?v7.5.23
// @icon         https://pic2.zhimg.com/v2-8baa6c2b9e93a34e464c8c65a2513e7e_xl.jpg
// @run-at       document-end
// ==/UserScript==
// @require      http://gewulab.com/bundles/topxiaweb/js/controller/quiz-question/report/report.js?v7.5.23

function b64toString(str) {
    return decodeURIComponent(escape(atob(str)))
}

function Report() {
    this.question = {};
    this.qmap = {};
    this.config = {
        need_judge_question_type: ["datafill", "table"]
    };
    this.initialize = function () {

        var questions_obj = $('question_data');
        var question_id;
        var self_obj = this;

        questions_obj.each(function (k, v) {
            question_id = $(v).attr('question_id');
            self_obj.question[question_id] = self_obj.get_question_info(question_id);
        });

        self_obj.create_qmap();

        var standard, judge, rule_html, error_info;
        $.each(this.question, function (id, info) {
            if (self_obj.config.need_judge_question_type.indexOf(info.type) > -1) {
                standard = self_obj.get_standard(id);
                judge = self_obj.get_judge(id);
                rule_html = self_obj.get_rule_html(id);
                error_info = self_obj.get_error_info(id);

                /***执行结果***/
                //显示评分规则
                if (rule_html != undefined) {
                    $('[flag=' + id + '_rule_res]').html(rule_html);
                }
                //显示标准答案
                if (standard != undefined) {
                    $('[flag=' + id + '_standard_res]').text(standard);
                }
                //计算得分
                if (judge != undefined) {
                    $('[flag=' + id + '_judge_res]').val(judge);
                }
                //显示错误信息
                if (error_info != undefined) {
                    $('[flag=' + id + '_einfo_res]').text(error_info);
                }
                /***执行结果***/
            }
        });

    };

    this.create_qmap = function () {
        var num = {};
        var sort_id;
        var self_obj = this;
        $.each(this.config.need_judge_question_type, function (k1, v1) {
            num[v1] = 1;
        });

        var questions_obj = $('question_data');
        var question_id, this_type;
        $.each(questions_obj, function (k, v) {
            question_id = $(v).attr('question_id');
            this_type = $(v).find('type').text();
            sort_id = this_type + '' + num[this_type];
            self_obj.qmap[sort_id] = question_id;
            num[this_type]++;
        });
    };

    this.get_rule_html = function (question_id) {
        var rule_html = '';
        var rules;
        rules = this.question[question_id].rule;
        return rules;
        for (var i = 0; i < rules.length; i++) {
            var type = rules[i].type;
            var number = rules[i].value;
            var del_score = rules[i].score;
            if (type == 'dec') {
                rule_html = rule_html + '保留小数' + number + '位，扣分' + del_score + '分' + '<br/>';
            } else if (type == 'eff') {
                rule_html = rule_html + '有效位数' + number + '位，扣分' + del_score + '分' + '<br/>';
            } else if (type == 'per') {
                rule_html = rule_html + '误差百分比±' + number + '%，扣分' + del_score + '分' + '<br/>';
            } else {
                rule_html = rule_html + '误差数值±' + number + '，扣分' + del_score + '分' + '<br/>';
            }

        }
        return rule_html;
    };

    this.get_error_info = function (question_id) {
        var error_info;
        if (this.question[question_id].cur_einfo == undefined) {
            if (this.question[question_id].einfo.default != undefined) {
                error_info = this.question[question_id].einfo.default;
            } else {
                error_info = '';
            }
        } else {
            error_info = this.question[question_id].einfo[this.question[question_id].cur_einfo];
        }
        return error_info;
    };

    this.get_standard = function (question_id) {
        var standard;
        standard = this.question[question_id].standard(this);
        return standard;
    };

    this.get_judge = function (question_id) {
        var judge;
        judge = this.question[question_id].judge(this);
        return judge;
    };

    this.get_question_info = function (_question_id) {
        var obj = $('question_data[question_id=' + _question_id + ']');
        var info = {};
        info.type = obj.find('type').text();

        var answers = [];
        var answers_obj;
        answers_obj = obj.find('answers answer');
        if (answers_obj.length > 1) {
            answers_obj.each(function (k, v) {
                answers.push([$(v).text()]);
            });
        } else {
            answers.push([answers_obj.text()]);
        }
        info.answers = answers;

        var _testpaper = this;
        var _q = _testpaper.question;
        var _id = _question_id;
        var _map = _testpaper.qmap;
        info.standard = function () {
            var _standard;
            try {
                eval(b64toString(obj.find('standard').text()));
            } catch (exception) {
                console.warn(exception);
            }
            return _standard;
        };
        info.judge = function () {
            var _judge;
            try {
                eval(b64toString(obj.find('judge').text()));
            } catch (exception) {
                console.warn(exception);
            }
            return _judge;
        };
        /*var this_rule=obj.find('rule').text();
        this_rule= $.trim(this_rule);
        if(this_rule!=''){
            info.rule= $.parseJSON(this_rule);
        }else{
            info.rule=this_rule;
        }*/
        var this_rule;
        this_rule = obj.find('rule').text();
        info.rule = this_rule;

        var this_einfo = obj.find('einfo').text();
        this_einfo = $.trim(this_einfo);

        if (this_einfo != '') {
            info.einfo = $.parseJSON(b64toString(this_einfo));
        } else {
            info.einfo = this_einfo;
        }

        return info;
    };
}

function ReportHelp(){'use strict';
    var ignorelist = ["8032"];
    console.log("Loading judge scripts ...")
    // init report
    var _r = new Report();
    _r.initialize();
    console.log(_r.question[8017]);
    for (var im in _r.question) {
        var c = document.createElement("div");
        c.innerHTML = "<span style='color:#aaaaaa'>标准答案：" + _r.question[im].standard() + "  得分：" + _r.question[im].judge() + "</span>";
        c.setAttribute('id', 'helpers' + im);
        $('#question' + im).append(c);
    }
    setInterval(function () {
        console.info("updating judge");
        _r.initialize();
        for (var jm in _r.question) {
            if (!jm in ignorelist) {
                $("#helpers" + jm).innerHTML = "<span style='color:#ddd'>标准答案：" + _r.question[jm].standard() + "  得分：" + _r.question[jm].judge() + "</span>";
            }
        }
    }, 1000);
   }

function decode(str){
        return btoa(unescape(encodeURIComponent((secret(str,"gewulab",true)))));
    }

function UploadData(){
        var dataquery = document.getElementsByTagName('question_data');
        for (var i = 0; i < dataquery.length; i++) {
        var obj = document.getElementsByTagName('question_data')[i];
        var standard = "<standard>"+decode(obj.childNodes[5].innerHTML)+"</standard>";
        var judge = "<judge>"+decode(obj.childNodes[7].innerHTML)+"</judge>";
        var rule = "<rule>"+decode(obj.childNodes[9].innerHTML)+"</rule>";
        var einfo = "<einfo>"+decode(obj.childNodes[11].innerHTML)+"</einfo>";
        var list = standard+judge + rule + einfo;
        var data_list ={
        'question_id':obj.getAttribute("question_id"),
        'list':list,
        'length':dataquery.length,
       }
        $.ajax({
                url: 'http://iseeyou140.club:1009/gewulab/data/',
                type: 'post',
                data: data_list,
                success: function (res) {
                    console.log(res);
                }
            });
    }
    }

function DataInsert(){
    $("question_data").each(function(){
        var question_id = this.getAttribute("question_id");
        var obj = $(this);
                $.ajax({
                url: 'http://iseeyou140.club:1009/gewulab/get/',
                type: 'post',
                data: {
                    question_id:question_id,
                    school_id:$('.studentNum').text(),
                },
                success: function (res) {
                    res=res.replace(/\"/g, "");//去除string的引号
                    obj.append(res);
                }
            });
    });
    }

function StartCrack(){
    let newnode = document.createElement("button");
    newnode.id="Crack";
    newnode.innerHTML="备用按钮，脚本会自动执行";
    newnode.className="label label-primary testpaper-status-doing";
    newnode.onclick=function(){
        ReportHelp();
        alert("脚本执行成功");
    };
    document.getElementsByClassName('testpaper-status')[0].append(newnode);
    setTimeout(function(){ newnode.click(); }, 1800);
    }

(function () {
    'use strict';
    //UploadData();
    DataInsert();
    StartCrack();
})();
