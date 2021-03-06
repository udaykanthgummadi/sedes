<?php
session_start();

$defaultSession = array(
    "id" => 1,
    "order_id" => 0,
    "current_stage" => 1,
    "show_id" => 0,
    "performance_id" => 0
);

if(!isset($_SESSION['progress'])) {
    $_SESSION['progress'] = $defaultSession;
}

// Report all errors except E_NOTICE
// This is the default value set in php.ini
error_reporting(E_ALL ^ E_NOTICE);

class controller {
    var $session;
    var $actions;
    
    function __construct() {
        $this->actions = new actions();
    }
    
}

?>