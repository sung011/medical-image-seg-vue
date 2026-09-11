<template>
  <div class="reg-box">
     
        <span class="re_tite">회원가입</span>
        <span class="sub_tite">1/2 계장 정보를 입력해 주세요</span>
        <div class="reg-button">
            <ul>
                <li :class="{ active: isFirstStep }">1 계정 정보</li>
                <li :class="{ active: !isFirstStep }">2 프로필·학교</li>
            </ul>
        </div>
        <hr>
        <form>
            <div v-show="isFirstStep" class="reg-01">
                <div class="text-r">
                    <label for="email">아이디 / 이메일 * 필수</label>  
                    <input v-model="email" type="text" id="email" name="email" placeholder="아이디 / 이메일을 입력해 주세요."/>
                </div> 

                <div class="text-r">
                    <label for="password">비밀번호 * 필수</label>  
                    <input v-model="password" type="password" id="password" name="password" placeholder="비밀번호를 입력해 주세요."/>
                </div> 
                <div class="text-r">
                    <label for="repassword">비밀번호 확인 * 필수</label>  
                    <input v-model="repassword" type="password" id="repassword" name="repassword" placeholder="비밀번호를 다시 입력해 주세요."/>
                </div> 
                <div class="text-r">
                    <button type="button" @click="nextStep">다음</button>
                </div> 
                <div class="text-r">
                    <router-link to="/login">이미 계정이 있으신가요? 로그인</router-link>
                </div>
                <div class="text-r">
                    <span>가입 후 직군을 선택하면 학습을 시작할 수 있습니다.</span>
                </div>
            </div>
            <div v-show="!isFirstStep" class="reg-02">
                <div class="text-r">
                    <label for="userNickname">이름 (닉네임) 최대 5자</label>  
                    <input v-model="userNickname" type="text" id="userNickname" name="userNickname" placeholder="이름 (닉네임)을 입력해 주세요."/>
                </div> 
                <div class="text-r">
                    <label for="userBirth">생년월일</label>  
                    <input v-model="userBirth" type="text" id="userBirth" name="userBirth" placeholder="생년월일을 입력해 주세요."/>
                </div>
                <div class="text-r">
                    <label for="userSchool">학교</label>  
                    <input v-model="userSchool" type="text" id="userSchool" name="userSchool" placeholder="학교를 입력해 주세요."/>
                </div>
                <div class="text-r">
                    <label for="userMajor">전공</label>  
                    <input v-model="userMajor" type="text" id="userMajor" name="userMajor" placeholder="전공을 입력해 주세요."/>
                </div>

                <div class="text-r">
                    <div class="w30">
                        <button  @click="isFirstStep = true">이전</button>
                    </div>
                    <div class="w70"> 
                        <button type="button" @click="nextStep">가입 완료</button>
                    </div>
                </div>
            </div>
        </form>
    </div> 
    
</template>

<script>
export default {
    data () {
        return {
            email: '',
            password: '',
            repassword: '',
            userNickname: '',
            userBirth: '',
            userSchool: '',
            userMajor: '',
            isFirstStep: true
        }
    },
    methods: {
        nextStep () {
            /*if (!this.email || !this.password || !this.repassword) {
                window.alert('필수 항목을 모두 입력해 주세요.')
                return
            }

            if (this.password !== this.repassword) {
                window.alert('비밀번호가 일치하지 않습니다.')
                return
            }

            window.alert('다음 단계로 이동합니다.')*/
            this.isFirstStep = false
        }
    }
}
</script>

<style scoped>
.reg-box {
  box-sizing: border-box;
  width: min(100%, 640px);
  min-height: 628px;
  border: 1px solid #e5e9f0;
  background: #fff;
  border-radius: 8px;
  margin: 0 auto;
  padding: 36px 40px;
  text-align: left;
}
.re_tite {
  text-align: left;
  font-size: 28px;
  font-weight: bold;
  display: block;
}
.sub_tite {
  text-align: left;
  font-size: 13px;
  color: #5c6579;
  display: block;
  margin-top: 18px;
}
.reg-button {
  margin-top: 18px;
}
.reg-button ul {
  display: flex;
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.reg-button ul li {
  width: 87px;
  height: 31px;
  border: 1px solid #e5e9f0;
  background-color: #e5e9f0;
  border-radius: 20px;
  text-align: center;
  line-height: 31px;
  font-size: 12px;
  font-weight: bold;
  color: #000000;
}
.reg-button ul li:nth-child(2) {
  margin-left: 10px;
  color: #5c6579;
  background-color: #fff;
}
.reg-button ul .active {
  border: 1px solid #2ec4b6;
  background-color: #2ec4b6;
  color: #000000;
}
hr {
  margin: 18px 0;
  border: 1px solid #e5e9f0;
}
.text-r {
  text-align: left;
  font-size: 13px;
  color: #1b2a57;
  margin-bottom: 8px;
  display: block;
}
.text-r label {
  display: block;
  margin-bottom: 8px;
}
.text-r input {
  width: 100%;
  height: 48px;
  border: 1px solid #e5e9f0;
  border-radius: 4px;
  padding-left: 12px;
  box-sizing: border-box;
  background-color: #f6f8fc;
  margin-bottom: 26px;
}
.text-r button {
  width: 100%;
  height: 48px;
  border: 1px solid #2ec4b6;
  background-color: #2ec4b6;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 18px;
  cursor: pointer;
}
.text-r a {
  color: #2ec4b6;
  font-size: 12px;
  text-decoration: none;
  margin-bottom: 18px;
}
.text-r .w30 button {
  color: #1b2a57;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid #e5e9f0;
  background-color: #fff;
}
.w30 {
  width: calc(30% - 12px);
  margin-right: 12px;
  display: inline-block;
}
.w70 {
  width: 70%;
  display: inline-block;
}
@media (max-width: 640px) {
  .reg-box {
    padding: 28px 20px;
    min-height: auto;
  }
  .re_tite {
    font-size: 24px;
  }
}
</style>