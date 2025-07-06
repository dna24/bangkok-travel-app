<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
};
</script>
<style>
body {
  margin: 0;         
  padding: 0;        
  font-family: 'Prompt'; 
  height: 100vh;  
}
</style>