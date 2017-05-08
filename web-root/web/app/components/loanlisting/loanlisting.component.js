'use strict';

(function() {

    var loanlistingController = function(loanService, EntityMapper, Loan, LoanSecurity, userService, $router) {

        var $ctrl = this;

        var user = userService.getLoggedInUser();
        $ctrl.currentUserRole = user && (user.roles instanceof Array) && user.roles[0].role;
        $ctrl.showSecurityMessage = false;
        $ctrl.securityUpdateStatus = false;
        $ctrl.showSecurityTable = false;
        $ctrl.addedRows = [];

        loanService.getLoanList({ usedId: user.id, userRole: user.roles[0].role }).then(function(response) {

            $ctrl.loanList = response.data;
            $ctrl.calculatePercentageApproval($ctrl.loanList);

        }, function() {});

        loanService.readSecurities().then(function(response){
            $ctrl.securitiesList = new EntityMapper(LoanSecurity).toEntities(response.data.securitiesList);
        }, function() {});

        $ctrl.calculatePercentageApproval = function(loanList){
            loanList.forEach(function(loan){
                var borrowers = loan.borrowers;
                var approvedCount = 0;
                borrowers.forEach(function(borrower){
                    if(borrower.acknowledgementStatus === true){
                        approvedCount +=1;
                    }
                });
                loan.percentageApproved = (approvedCount/borrowers.length)*100;
                if(loan.percentageApproved === 0) {
                    loan.percentageStatus = 100;
                } 
                else {
                     loan.percentageStatus = loan.percentageApproved;
                }
            });
        };
         
         $ctrl.multipleborrowerList = function(loan){
            if(loan.borrowers.length > 1 ){
                loan.showBorrowerList = !loan.showBorrowerList;
            }
            else {
                 loan.showBorrowerList = loan.showBorrowerList;
            }
         }
        //Update Security Price -- Starts
        $ctrl.borrowerList = function(loan){
            $ctrl.ListOfBorrowers = [];
            loan.borrowers.forEach(function(item){
                
                $ctrl.ListOfBorrowers.push({
                    id: item.id,
                    firstName: item.fname,
                    phone: item.phone,
                    status: item.borrApproved
                });
            });
            return $ctrl.ListOfBorrowers;
        }
        //Update Security Price -- Starts
        
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
        //Update Security Price -- Ends

        $ctrl.navigateToLoanDetails = function(loanId) {
            $router.navigate(['LoadLoanDetails', { id: loanId }]);
        };
    };

    loanlistingController.$inject = ['loanService', 'EntityMapper', 'Loan', 'LoanSecurity', 'userService', '$router'];


    var componentConfig = {
        // isolated scope binding
        bindings: {
            loanInfo: '<'
        },
        templateUrl: 'loanlisting/loanlisting.html',
        controller: loanlistingController,
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

    module.exports = angular.module('loanlisting')
        .component('loanListing', componentConfig);

})();
