(function(simply) {
    
    simply.views.checkout = Backbone.View.extend({
        
        initialize: function() {
            this.setElement(this.make('div', {"class": 'orderSummary'}, 'Loading order summary please wait...'));
            
            _.bindAll(this);
            this.renderInfo();
        },
        
        addRow: function(label, value) {
            var row = $(this.make('tr'));
            row.append(this.make('th', {}, label + ':'));
            row.append(this.make('td', {}, value));
            
            this.table.append(row);
        },
        
        events: {
            'click .nextButton button' : 'next',
            'click .previousButton button' : 'previous'
        },
        
        previous: function() {
            location.hash = 'your-info';
        },
        
        next: function() {
            
            if(simply.session.get('manual')) {
                $.ajax({
                    url: '/api.php/orderManual',
                    success: this.handleManual,
                    error: this.handleError,
                    dataType: 'json'
                });
            }else{
                this.form.submit();
            }
    
        },
        
        handleManual: function() {
            alert('Booking made, email confirmation sent');
            location.hash = '';
        },
        
        handleError: function() {
            alert('Manual Booking failed');  
        },
        
        renderInfo: function() {
            
            //Render the table
            this.table = $(this.make('table', {"id" : "summary"}));
            
            //this.table.append(this.make('thead', {}, 'Please confirm your order'));
            
            this.addRow('You are seeing', simply.shows.getSelectedShow().get('name'));
            this.addRow('On', simply.performances.getSelectedPerformance().get('name'));
            
            //TO DO hard coded to Rhoda, this needs to come from DB
            
            this.addRow('At', 'Rhoda McGaw Theatre, Woking');
            
            //Now grab the seats
            var rows = simply.seats.convertToRows(simply.seats.getSelectedSeats());
            
            var rowsHolder = $(this.make('div',{ "class" : "rowsHolder"}));
            
            var row, rowContainer, rowView;
            
            for(row in rows) {
                rowContainer = $(this.make('div', {"class" : "row"}));
                
                rowContainer.append(this.make('div', {"class" : "rowId"}, row));
                
                for(seat in rows[row]) {
                    rowView = new simply.views.seat({model: rows[row][seat], collection: this.collection, readonly: true});
                    rowContainer.append(rowView.render());
                }
                
                rowsHolder.append(rowContainer);
            }
            
            this.addRow('Seats', rowsHolder);
            
            var ticketsChosen = simply.ticketTypes.getOrderedTickets();
            
            var wrapper = $(this.make('div'));
            
            this.form = $(simply.templates.paypal());
            
            //TO DO this should be a template
            var ticketsList = $(this.make('table', {"id" : "money"}));
            
            var head = $(this.make('tr'));
            head.append(this.make('th', {}, 'Ticket Type'));
            head.append(this.make('th', {}, 'Quantity'));
            head.append(this.make('th', {}, 'Price'));
            head.append(this.make('th', {}, 'Total'));
            
            ticketsList.append(head);
            
            this.orderTotal = 0;
            var ticketsTotal = 0;
            
            for(var x=0; x<ticketsChosen.length; x+=1) {
                
                ticketsTotal += ticketsChosen[x].get('quantity');
                
                rowTotal = ticketsChosen[x].get('quantity') * ticketsChosen[x].get('price');
                
                tr = $(this.make('tr'));
                tr.append(this.make('td', {}, ticketsChosen[x].get('name')));
                
                tr.append(this.make('td', {}, ticketsChosen[x].get('quantity')));
                
                tr.append(this.make('td', {}, '&pound;' + ticketsChosen[x].get('price')));
                
                tr.append(this.make('td', {}, '&pound;' + this.roundNumber(rowTotal, 2)));
                
                ticketsList.append(tr);
                
                this.orderTotal += rowTotal;
            }
            
            //TO DO this should be in an order summary model
            var bookingFee = 1;
            console.log('bf', ticketsTotal);
            this.orderTotal = Math.round(this.orderTotal * 100) / 100;
            
            var endRow = $(this.make('tr', {"class": 'orderFooter'}));
            endRow.append(this.make('td', {'colspan': 3, "class": 'totalCell'}, 'Sub Total'));
            endRow.append(this.make('td', {}, '&pound;' + this.roundNumber(this.orderTotal, 2)));
            
            ticketsList.append(endRow);
            
            var feeRow = $(this.make('tr', {"class": 'orderFooter'}));
            feeRow.append(this.make('td', {'colspan': 3, "class": 'totalCell'}, 'Booking Fee'));
            feeRow.append(this.make('td', {}, '&pound;' + this.roundNumber(bookingFee, 2)));
            
            ticketsList.append(feeRow);
            
            var grandTotal = bookingFee + this.orderTotal;
            
            var totalRow = $(this.make('tr', {"class": 'orderFooter'}));
            totalRow.append(this.make('td', {'colspan': 3, "class": 'totalCell'}, 'Total'));
            totalRow.append(this.make('td', {}, '&pound;' + this.roundNumber(grandTotal, 2)));
            
            this.form.append(this.make('input', { type: 'hidden', value: grandTotal, name: 'amount'}));
            this.form.append(this.make('input', { type: 'hidden', value: 'Simply Theatre Tickets', name: 'item_name'}));
            this.form.append(this.make('input', { type: 'hidden', value: 'http://tickets.simplytheatre.net/#complete', name: 'return'}));
            this.form.append(this.make('input', { type: 'hidden', value: 'http://tickets.simplytheatre.net/api.php/ipn', name: 'notify_url'}));
            this.form.append(this.make('input', { type: 'hidden', value: 'goliver1984@gmail.com', name: 'business'}));
            //this.form.append(this.make('input', { type: 'hidden', value: 'tomcco_1336668200_biz@gmail.com', name: 'business'}));
            this.form.append(this.make('input', { type: 'hidden', value: simply.session.get('order_id'), name: 'custom'}));
            
            
            
            ticketsList.append(totalRow);
            
            this.addRow('Tickets', ticketsList);
            
            wrapper.append(this.table);
            
            var nextButtonWrap = $(this.make('div', {"class": 'buttonWrapper nextButton'}));
            var nextButton = $(this.make('button', {}, 'Next'));
            
            nextButtonWrap.append(nextButton);
            
            wrapper.append(nextButtonWrap);
            
            var prevButtonWrap = $(this.make('div', {"class": 'buttonWrapper previousButton'}));
            var prevButton = $(this.make('button', {}, 'Back'));
            
            prevButtonWrap.append(prevButton);
            
            wrapper.append(prevButtonWrap);
            
            this.$el.html(wrapper);
            this.$el.append(this.form);
            
        },
        
        roundNumber: function(num, dec) {
            var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
            
            result = result + '';
            
            parts = result.split('.');
            
            if(!parts[1]) {
                parts[1] = '00';
            }
            
            result = this.pad(parts[0], 'left') + '.' + this.pad(parts[1], 'right');
            
            
            
            return result;
        },
        
        pad: function(num, direction) {
            
            if(num.length < 2) {
                if(direction === 'left') {
                    num =  num;
                }else{
                    num = num + '0';
                }
            }
            
            return num;
        },
        
        render: function() {
            
            
            return this.$el;
            
        }
    });
    
})(window.simply);