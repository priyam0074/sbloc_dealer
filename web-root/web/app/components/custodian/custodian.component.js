'use strict';

(function() {

    var custodianController = function(loanService,userService, $router) {

        var $ctrl = this;
        $ctrl.collateralAccountShow = false;
        var user = userService.getLoggedInUser();
        $ctrl.currentUserRole = user && (user.roles instanceof Array) && user.roles[0].role;
        $ctrl.addedRows = [];
        $ctrl.showSecurityMessage = false;
        $ctrl.securityUpdateStatus = false;
        $ctrl.showSecurityTable = false;

        $ctrl.getCollateralAccount = function(){
          $ctrl.collateralAccountShow =  true;
            loanService.getCollateralAccountList($ctrl.phoneNumber).then(function(response){
               $ctrl.CollateralAccount = response.data.collateralAccounts;

        });
       };
       loanService.readSecurities().then(function(response){
            $ctrl.securitiesList = new EntityMapper(LoanSecurity).toEntities(response.data.securitiesList);
        }, function() {});
       $ctrl.addRow = function() {
            $ctrl.dropdownvalues = [];
                $ctrl.securitiesList.forEach(function(item){
                    $ctrl.dropdownvalues.push(item.name);
                });

                var inserted = {
                    dropdownValues:$ctrl.dropdownvalues,
                    id: '' ,
                    name: '',
                    price: null,
                    newPrice:null,
                    editPrice: true
                };
                $ctrl.updatePrice = true;
                $ctrl.addedRows.push(inserted);
                $ctrl.showSecurityTable = true;
        };
    
        $ctrl.getRowBySelection = function(row) {
            if(row.dropdownValue !== undefined && row.dropdownValue !== null){
                for(var i = 0; i< $ctrl.securitiesList.length; i++) {
                     if($ctrl.securitiesList[i].name === row.dropdownValue) {
                        row.id = $ctrl.securitiesList[i].id ;
                        row.name= $ctrl.securitiesList[i].name;
                        row.price= $ctrl.securitiesList[i].price;
                        row.newPrice= row.newPrice;
                        row.editPrice = false;
                    }
                } 
                return row;
            }
            else if(row.dropdownValue === null){
                        row.id = '';
                        row.name= ''
                        row.price= null;
                        row.newPrice= null;
                        row.editPrice = true;
                        return row;
            }
            else {
                return $ctrl.addedRows;
            }
        };  
    
        // delete row
        $ctrl.deleteRow = function(row) {
            var index = $ctrl.addedRows.indexOf(row);
            $ctrl.addedRows.splice(index, 1);
            if(!$ctrl.addedRows.length){
                $ctrl.showSecurityTable = false;
            }
        }; 

        // update price
        $ctrl.updateSecurityPrice = function() {

            var reqObj = {
                caller : ($ctrl.currentUserRole === 'custodian' ? 2 : 0),
                securityList : []
            }
            
            $ctrl.addedRows.forEach(function(item){
                if(item.newPrice && item.id){
                    reqObj.securityList.push(item);
                }
            });

            if(reqObj.securityList.length>0){
                loanService.updateSecurityPrice(reqObj).then(function(response){
                        if(response && response.data){
                                $ctrl.securityUpdateMessage = response.data.message;
                                $ctrl.showSecurityMessage = true;
                                $ctrl.securityUpdateStatus = response.data.success;
                                if(response.data.success){
                                    reqObj.securityList.forEach(function(item){
                                        item.price = item.newPrice ? item.newPrice : item.price;
                                        item.newPrice ='';
                                    });
                                }
                        }
                });
            } else {
                $ctrl.securityUpdateMessage = "Atleast one security's new price needs to be entered !";
                $ctrl.showSecurityMessage = true;
                $ctrl.securityUpdateStatus = false;
            }
        };
       /*$ctrl.showSecurity = function(collateralAccount) {
         collateralAccount.showSecurityList =  !collateralAccount.showSecurityList;
         var params = {
         	collateralAccountID: collateralAccount.id,
         	collateralAccountCount: collateralAccount.count
         }
         loanService.getAccountSecuritiesOnCreate(params)
                .then(function(response){
            collateralAccount.securityList = response.data.securityDetails;
                });
       };*/
    };
    custodianController.$inject = ['loanService', 'userService', '$router'];

     var componentConfig = {
        // isolated scope binding
        bindings: {
            loanInfo: '<'
        },
        templateUrl: 'custodian/custodian.html',
        controller: custodianController,
        $canActivate: [
            '$nextInstruction',
            '$prevInstruction',
            'userService',
            '$router',
            function($nextInstruction, $prevInstruction, userService,
                $router) {
                if (userService.isAnonymous() === true) {
                    $router.navigate(['Login']);
                    return false;
                } else {
                    return true;
                }
            }
        ]
    };

    module.exports = angular.module('custodian')
        .component('custodian', componentConfig);

})();