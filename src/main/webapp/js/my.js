
$(document).ready(function () {
    var select = $('#pages-count');

    for (let i = 3; i <= 20; i++) {
        var option = $('<option></option>').val(i).text(i);
        select.append(option);
    }


    let accountsPerPage = parseInt($('#pages-count').val());
    let currentPage = 0;



    function updateTable() {
        $.ajax({
            type: "GET",
            url: "rest/players/count",
            success: function (totalAccounts) {
                let totalPages = Math.ceil(totalAccounts / accountsPerPage)
                $.ajax(
                    {
                        type: "GET",
                        url: "rest/players/",
                        data:
                            {
                                pageNumber: currentPage,
                                pageSize: accountsPerPage
                            },
                        success: function (data) {
                            var tbody = $('#myTable tbody');
                            tbody.empty();
                            data.forEach(function (player) {
                                var row = $('<tr></tr>');
                                row.append('<td>' + player.id + '</td>');
                                row.append('<td>' + player.name + '</td>');
                                row.append('<td>' + player.title + '</td>');
                                row.append('<td>' + player.race + '</td>');
                                row.append('<td>' + player.profession + '</td>');
                                row.append('<td>' + player.level + '</td>')
                                var formattedDate = formatDateFromMilliseconds(player.birthday);
                                row.append('<td>' + formattedDate + '</td>');
                                row.append('<td>' + player.banned + '</td>');

                                var imgForEdit = $('<img>', {
                                    src: '/img/edit.png',
                                    class: 'edit-icon',
                                    'data-id': player.id,
                                    css: { cursor: 'pointer', width: '20px', height: '20px' }
                                });

                                row.append($('<td></td>').append(imgForEdit));

                                // Создание и добавление кнопки удаления
                                var imgForDelete = $('<img>', {
                                    src: '/img/delete.png',
                                    class: 'delete-icon',
                                    'data-id': player.id,
                                    css: { cursor: 'pointer', width: '20px', height: '20px' }
                                });
                                row.append($('<td></td>').append(imgForDelete));
                                tbody.append(row);
                            });
                            updatePagination(totalPages);
                        }
                    }
                );
            }
        })
    }

    function updatePagination(totalPages) {
        $('#pages').empty();
        for (let i = 0; i < totalPages; i++) {
            let pageButton = $(`<button>${i + 1}</button>`); // Показываем страницы с 1, а не с 0
            pageButton.on('click', function () {
                currentPage = i;
                updateTable();
            });
            if (i === currentPage) {
                pageButton.addClass('current-page');
            }
            $('#pages').append(pageButton);
        }
    }

    // Обработка изменения количества аккаунтов на странице
    $('#pages-count').on('change', function () {
        accountsPerPage = parseInt($(this).val());
        currentPage = 0; // Сброс к первой странице при изменении количества аккаунтов на странице
        updateTable();
    });



    $('#myTable').on('click', '.delete-icon', function() {
        var playerId = $(this).data('id');
        deleteUser(playerId);
    });

    function deleteUser(playerId)
    {
        $.ajax(
            {
                type:"DELETE",
                url:`rest/players/${playerId}`,
                success: function()
                {
                    updateTable();
                },
                error: function(error) {
                    console.error("Error deleting player:", error);
                    alert('Failed to delete player.');
                }



            }
        );
    }


    $('#myTable').on('click', '.edit-icon', function() {
        var playerId = $(this).data('id');
        editUser($(this), playerId);
    });


    function editUser(icon, id)
    {
        icon.closest('tr').find('.delete-icon').hide();

        icon.attr('src','/img/save.png');
        icon.removeClass('edit-icon').addClass('save-icon');


        var row=icon.closest('tr');
        row.find('td').each(function(index) {
            var cell = $(this);
            if (index === 1 || index === 2 || index === 3 || index === 4 || index === 7) {
                var cellContent = cell.text();
                var input;

                if (index === 7) {
                    // Для поля Banned используем dropdown
                    input = $('<select></select>', {
                        css: { width: '100%' }
                    });
                    input.append('<option value="true">true</option>');
                    input.append('<option value="false">false</option>');
                    let booleanValue = cellContent === 'true' ? 'true' : 'false';

                    input.val(booleanValue);
                } else {
                    input = $('<input>', {
                        type: 'text',
                        value: cellContent,
                        css: { width: '100%' }
                    });
                }

                cell.html(input);
            }
        });


        icon.on('click',function()
        {
            var updatedPlayer = {};
            row.find('td').each(function(index) {
                var cell = $(this);
                var input = cell.find('input, select');
                if (input.length > 0) {
                    var value = input.val();

                    switch (index) {
                        case 1: updatedPlayer.name = value; break;
                        case 2: updatedPlayer.title = value; break;
                        case 3: updatedPlayer.race = value; break;
                        case 4: updatedPlayer.profession = value; break;
                        case 7: updatedPlayer.banned = value === 'true'; break;
                    }

                    // Возвращаем текстовое значение в ячейку после сохранения
                    cell.html(value);
                }
            });

            $.ajax({
                type: "POST",
                url: `rest/players/${id}`,
                data: JSON.stringify(updatedPlayer),
                contentType: "application/json",
                success: function() {
                    updateTable(); // Обновить таблицу после сохранения
                },
                error: function(error) {
                    console.error("Error updating player:", error);
                    alert('Failed to update player.');
                }
            });

            // После сохранения возвращаем оригинальное состояние
            icon.attr('src', '/img/edit.png');
            icon.removeClass('save-icon').addClass('edit-icon');

            // Показываем кнопку удаления снова
            icon.closest('tr').find('.delete-icon').show();
        });

    }



    $('#create-account-form').on('submit',function(event) {
        event.preventDefault();

        const formData={
            name: $('#name').val(),
            title: $('#title').val(),
            race: $('#race').val(),
            profession: $('#profession').val(),
            level: parseInt($('#level').val(), 10), // Преобразуем уровень в целое число
            birthday: new Date($('#birthday').val()).getTime(),
            banned:$('banned').val()
        };

        $.ajax(
            {
                type:"POST",
                url:"rest/players",
                contentType:"application/json",
                data:JSON.stringify(formData),
                success: function(response) {


                    $('#create-account-form')[0].reset();

                     updateTable();
                },

            }
        )
    });
    function formatDateFromMilliseconds(milliseconds) {
        const date = new Date(milliseconds);

        // Форматируем дату
        const day = String(date.getDate()).padStart(2, '0'); // День
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяц (месяцы начинаются с 0)
        const year = date.getFullYear(); // Год

        return `${day}/${month}/${year}`;
    }

    updateTable();
});