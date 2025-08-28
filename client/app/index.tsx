import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Link } from 'expo-router';
import Homepage from "./components/Home/Homepage";
import Dashboard from "./components/Dashboard/Dashboard";
import AuthGuard from "./components/AuthGuard";

export default function Index() {
  return <AuthGuard />;
}

const styles=StyleSheet.create({
  container:{
    justifyContent:'center',
    alignItems:'center',
    borderColor:'red',
    borderWidth:1,
  },
  registerBox:{
    padding:20,
    backgroundColor:'yellow',
    borderRadius:10,

  }
})