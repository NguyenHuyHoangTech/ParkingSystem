-- ==========================================
-- Parking Management System - Database Schema (3NF)
-- RDBMS: Microsoft SQL Server
-- ==========================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ParkingManagementSystem')
BEGIN
    CREATE DATABASE [ParkingManagementSystem];
END
GO

USE [ParkingManagementSystem];
GO

    create table accounts (
        account_id int identity not null,
        is_deleted bit not null,
        created_at datetime2(6),
        updated_at datetime2(6),
        phone_number varchar(20),
        status varchar(20) not null,
        role_code varchar(50) not null,
        username varchar(50) not null,
        created_by varchar(100),
        email varchar(100),
        updated_by varchar(100),
        full_name varchar(150),
        password_hash varchar(255) not null,
        primary key (account_id)
    );
GO

    create table additional_services (
        service_id int identity not null,
        unit_price float(53) not null,
        service_name varchar(100) not null,
        primary key (service_id)
    );
GO

    create table blacklists (
        blacklist_id int identity not null,
        created_at datetime2(6),
        license_plate varchar(20) not null,
        reason varchar(500),
        primary key (blacklist_id)
    );
GO

    create table bookings (
        account_id int not null,
        booking_id int identity not null,
        floor_id int not null,
        is_deleted bit not null,
        session_id int,
        slot_id int,
        total_fee float(53),
        type_id int not null,
        created_at datetime2(6),
        end_time datetime2(6) not null,
        start_time datetime2(6) not null,
        updated_at datetime2(6),
        license_plate varchar(20),
        status varchar(20) not null,
        payment_method varchar(50),
        created_by varchar(100),
        updated_by varchar(100),
        qr_code_value varchar(255),
        primary key (booking_id)
    );
GO

    create table building_structures (
        floor_id int not null,
        height int,
        pos_x int,
        pos_y int,
        structure_id int identity not null,
        width int,
        name varchar(50),
        type varchar(50),
        primary key (structure_id)
    );
GO

    create table building_vehicle_configs (
        building_id int not null,
        config_id int identity not null,
        is_supported bit not null,
        max_height float(53),
        max_weight float(53),
        type_id int not null,
        primary key (config_id)
    );
GO

    create table configuration_audit_logs (
        audit_id int identity not null,
        changed_by int not null,
        changed_at datetime2(6) not null,
        config_key varchar(100) not null,
        new_value NVARCHAR(MAX),
        old_value NVARCHAR(MAX),
        primary key (audit_id)
    );
GO

    create table daily_aggregated_reports (
        building_id int not null,
        peak_hour int,
        report_date date not null,
        report_id int identity not null,
        total_entries int,
        total_exits int,
        total_revenue float(53),
        type_id int not null,
        primary key (report_id)
    );
GO

    create table exception_logs (
        exception_id int identity not null,
        fine_applied float(53),
        gate_id int,
        handled_by int,
        is_deleted bit not null,
        reported_by_account_id int,
        session_id int,
        created_at datetime2(6),
        resolved_at datetime2(6),
        updated_at datetime2(6),
        status varchar(20) not null,
        exception_type varchar(50) not null,
        reported_by varchar(50),
        created_by varchar(100),
        updated_by varchar(100),
        description varchar(500),
        resolution_note varchar(500),
        evidence_images varchar(2000),
        primary key (exception_id)
    );
GO

    create table floors (
        building_id int not null,
        floor_id int identity not null,
        floor_order int,
        is_deleted bit not null,
        map_cols int,
        map_rows int,
        created_at datetime2(6),
        updated_at datetime2(6),
        status varchar(20),
        floor_name varchar(50) not null,
        created_by varchar(100),
        updated_by varchar(100),
        primary key (floor_id)
    );
GO

    create table floor_vehicle_allocations (
        floor_id int not null,
        is_active bit not null,
        priority_index int not null,
        type_id int not null,
        primary key (floor_id, type_id)
    );
GO

    create table gates (
        building_id int,
        gate_id int identity not null,
        is_deleted bit not null,
        created_at datetime2(6),
        updated_at datetime2(6),
        gate_type varchar(10) not null,
        gate_name varchar(50) not null,
        created_by varchar(100),
        updated_by varchar(100),
        primary key (gate_id)
    );
GO

    create table monthly_tickets (
        end_date date not null,
        is_deleted bit not null,
        start_date date not null,
        ticket_id int identity not null,
        vehicle_type_id int,
        created_at datetime2(6),
        updated_at datetime2(6),
        license_plate varchar(20) not null,
        phone_number varchar(20),
        status varchar(20) not null,
        created_by varchar(100),
        customer_name varchar(100) not null,
        updated_by varchar(100),
        primary key (ticket_id)
    );
GO

    create table parking_buildings (
        building_id int identity not null,
        close_time time,
        is_deleted bit not null,
        latitude float(53),
        longitude float(53),
        manager_id int,
        open_time time,
        created_at datetime2(6),
        updated_at datetime2(6),
        hotline varchar(20),
        status varchar(20),
        created_by varchar(100),
        name varchar(100) not null,
        updated_by varchar(100),
        rules_description varchar(2000),
        address varchar(255) not null,
        primary key (building_id)
    );
GO

    create table parking_cards (
        building_id int,
        card_id int identity not null,
        status varchar(20) not null,
        card_code varchar(50) not null,
        primary key (card_id)
    );
GO

    create table parking_sessions (
        account_id int,
        card_id int,
        check_in_staff_id int,
        check_out_staff_id int,
        exit_gate_id int,
        gate_id int,
        is_deleted bit not null,
        is_flagged bit,
        session_id int identity not null,
        slot_id int,
        total_fee float(53),
        type_id int,
        created_at datetime2(6),
        time_in datetime2(6),
        time_out datetime2(6),
        updated_at datetime2(6),
        license_plate_in varchar(20),
        license_plate_out varchar(20),
        status varchar(20) not null,
        card_code varchar(50),
        created_by varchar(100),
        updated_by varchar(100),
        car_image_in varchar(255),
        car_image_out varchar(255),
        primary key (session_id)
    );
GO

    create table parking_zones (
        floor_id int not null,
        height int,
        pos_x int,
        pos_y int,
        width int,
        zone_id int identity not null,
        name varchar(50),
        primary key (zone_id)
    );
GO

    create table payment_transactions (
        amount float(53) not null,
        session_id int not null,
        transaction_id int identity not null,
        payment_time datetime2(6) not null,
        payment_method varchar(20) not null,
        status varchar(20) not null,
        gateway_reference_id varchar(100),
        primary key (transaction_id)
    );
GO

    create table penalty_rules (
        fine_amount float(53) not null,
        rule_id int identity not null,
        rule_type varchar(30) not null,
        description varchar(255),
        primary key (rule_id)
    );
GO

    create table permissions (
        permission_id int identity not null,
        module varchar(50) not null,
        permission_code varchar(100) not null,
        description varchar(255),
        primary key (permission_id)
    );
GO

    create table pricing_blocks (
        block_id int identity not null,
        first_block_duration_minutes int not null,
        first_block_rate float(53) not null,
        rule_id int not null,
        subsequent_block_duration_minutes int not null,
        subsequent_block_rate float(53) not null,
        time_frame_end time not null,
        time_frame_start time not null,
        primary key (block_id)
    );
GO

    create table pricing_policies (
        building_id int not null,
        is_active bit not null,
        policy_id int identity not null,
        effective_date datetime2(6) not null,
        expiry_date datetime2(6),
        policy_name varchar(100) not null,
        primary key (policy_id)
    );
GO

    create table role_permissions (
        permission_id int not null,
        role_permission_id int identity not null,
        role_code varchar(50) not null,
        primary key (role_permission_id)
    );
GO

    create table slots (
        allow_pre_booking bit,
        floor_id int not null,
        is_deleted bit not null,
        pos_x int,
        pos_y int,
        slot_id int identity not null,
        type_id int,
        created_at datetime2(6),
        updated_at datetime2(6),
        slot_name varchar(20),
        status varchar(20) not null,
        created_by varchar(100),
        updated_by varchar(100),
        primary key (slot_id)
    );
GO

    create table slot_status_history (
        changed_by_id int not null,
        history_id int identity not null,
        slot_id int not null,
        created_at datetime2(6) not null,
        new_status varchar(20) not null,
        old_status varchar(20),
        reason varchar(255),
        primary key (history_id)
    );
GO

    create table system_configurations (
        last_modified_by int,
        last_modified_at datetime2(6),
        data_type varchar(20) not null,
        category varchar(50) not null,
        config_key varchar(100) not null,
        config_value NVARCHAR(MAX),
        description varchar(255),
        primary key (config_key)
    );
GO

    create table system_roles (
        role_code varchar(50) not null,
        role_name varchar(100) not null,
        primary key (role_code)
    );
GO

    create table transaction_details (
        amount float(53) not null,
        detail_id int identity not null,
        penalty_id int,
        service_id int,
        session_id int,
        transaction_id int not null,
        item_type varchar(50) not null,
        primary key (detail_id)
    );
GO

    create table user_facility_mappings (
        account_id int not null,
        building_id int not null,
        mapping_id int identity not null,
        primary key (mapping_id)
    );
GO

    create table user_feedback_tickets (
        account_id int not null,
        assigned_to_account_id int,
        booking_id int,
        building_id int not null,
        session_id int,
        ticket_id int identity not null,
        created_at datetime2(6) not null,
        status varchar(20) not null,
        issue_category varchar(50) not null,
        description varchar(1000) not null,
        resolution_note varchar(1000),
        evidence_images NVARCHAR(MAX),
        primary key (ticket_id)
    );
GO

    create table user_permissions (
        account_id int not null,
        permission_id int not null,
        user_permission_id int identity not null,
        primary key (user_permission_id)
    );
GO

    create table vehicle_pricing_rules (
        grace_period_minutes int not null,
        lost_ticket_surcharge float(53),
        max_daily_cap float(53),
        policy_id int not null,
        rule_id int identity not null,
        type_id int not null,
        primary key (rule_id)
    );
GO

    create table vehicle_types (
        grid_height int,
        grid_width int,
        size_multiplier float(53),
        type_id int identity not null,
        status varchar(20),
        type_name varchar(50) not null,
        primary key (type_id)
    );
GO

    create table zone_vehicle_types (
        type_id int not null,
        zone_id int not null,
        primary key (type_id, zone_id)
    );
GO

    alter table accounts 
       add constraint UKk8h1bgqoplx0rkngj01pm1rgp unique (username);
GO

    create index idx_blacklist_plate 
       on blacklists (license_plate);
GO

    alter table blacklists 
       add constraint UK7sqcfs9vxgp336nsrdrbkecku unique (license_plate);
GO

    create unique nonclustered index UKrabs7vu6ojmqo07dykxvp8p1r 
       on bookings (session_id) where session_id is not null;
GO

    alter table building_vehicle_configs 
       add constraint UKr3bbu4j7hyr430px4ux2wg1ww unique (building_id, type_id);
GO

    alter table monthly_tickets 
       add constraint UKffft7in5qcnadcxn90ns4kp9a unique (license_plate);
GO

    alter table parking_cards 
       add constraint UK8tx874telt6o9yffrhthdlhkv unique (card_code);
GO

    alter table permissions 
       add constraint UK3t7dqv661lw96xkq9kqgmbtw6 unique (permission_code);
GO

    alter table user_facility_mappings 
       add constraint UKn135oa0s839vmiecyh9p9hepp unique (account_id, building_id);
GO

    alter table accounts 
       add constraint FKi8w65iawttf7ur1axggbc3xtu 
       foreign key (role_code) 
       references system_roles;
GO

    alter table bookings 
       add constraint FKhcfkyj8r1xvkn4kbkpcyr1im 
       foreign key (account_id) 
       references accounts;
GO

    alter table bookings 
       add constraint FKbqsud3nbcw4t2ky4b9901dc51 
       foreign key (floor_id) 
       references floors;
GO

    alter table bookings 
       add constraint FKbhx39bq73f4d3xddcig9o3ydi 
       foreign key (session_id) 
       references parking_sessions;
GO

    alter table bookings 
       add constraint FKk9hp0313ktm0adh5xha81hdjb 
       foreign key (slot_id) 
       references slots;
GO

    alter table bookings 
       add constraint FK6d5os0h0xx8q1wcv8dvy9a9am 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table building_structures 
       add constraint FK8m3u0u5pcyf4wx05v85b9vxj3 
       foreign key (floor_id) 
       references floors;
GO

    alter table building_vehicle_configs 
       add constraint FKelspaphwvyx7rn89s1vp6ibvc 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table building_vehicle_configs 
       add constraint FKl221lfxje121ys9t7kn7ng8ev 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table configuration_audit_logs 
       add constraint FKtdh9ppe954s1gx2sfqthncore 
       foreign key (changed_by) 
       references accounts;
GO

    alter table daily_aggregated_reports 
       add constraint FKg7aks1tj04tq0p052cecscp6n 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table daily_aggregated_reports 
       add constraint FKl0oh64u0g4s3uxbsxq2db40mc 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table exception_logs 
       add constraint FK2g3ks6yx2476tblidx4e9frxx 
       foreign key (gate_id) 
       references gates;
GO

    alter table exception_logs 
       add constraint FK3pb02a9x95kcdjera0tasd4ew 
       foreign key (handled_by) 
       references accounts;
GO

    alter table exception_logs 
       add constraint FKqmekgde3008yv3vpmp5yif3qc 
       foreign key (reported_by_account_id) 
       references accounts;
GO

    alter table exception_logs 
       add constraint FK5pv6qccxa0gqn52xfcnrlj7rp 
       foreign key (session_id) 
       references parking_sessions;
GO

    alter table floors 
       add constraint FK2rc4ijrldeqt5daqp6jgf1ig4 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table floor_vehicle_allocations 
       add constraint FKfrlf21u9i0vthpfebheubhamk 
       foreign key (floor_id) 
       references floors;
GO

    alter table floor_vehicle_allocations 
       add constraint FKjg5yqdw0ys2nrqlcx5w4065ao 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table gates 
       add constraint FKe26cpu5o5ebg65l4jgyvotxn9 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table monthly_tickets 
       add constraint FKahji2m5cdkvlm8vhtollpthdt 
       foreign key (vehicle_type_id) 
       references vehicle_types;
GO

    alter table parking_buildings 
       add constraint FK7x5ngcqhrjpd4gu7fxkefucua 
       foreign key (manager_id) 
       references accounts;
GO

    alter table parking_cards 
       add constraint FKlch6cvpbu4q1k6xl2n3t5frfq 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table parking_sessions 
       add constraint FK4ofj9wpgxobs61oupkyhbx236 
       foreign key (account_id) 
       references accounts;
GO

    alter table parking_sessions 
       add constraint FKjhdoamp6260ko786r8g41sksh 
       foreign key (check_in_staff_id) 
       references accounts;
GO

    alter table parking_sessions 
       add constraint FKllsf8ls4v1b7oqw2h02y1ral8 
       foreign key (check_out_staff_id) 
       references accounts;
GO

    alter table parking_sessions 
       add constraint FKrbroq4ghdc65w8cp7hs1mqygt 
       foreign key (gate_id) 
       references gates;
GO

    alter table parking_sessions 
       add constraint FK6a822rrpeq4sxd8dxq4q1tlp7 
       foreign key (exit_gate_id) 
       references gates;
GO

    alter table parking_sessions 
       add constraint FK36gv7kdv32utum7s2x92dhnhf 
       foreign key (card_id) 
       references parking_cards;
GO

    alter table parking_sessions 
       add constraint FKslggpksrx8ndhjxbxxvl1g5vp 
       foreign key (slot_id) 
       references slots;
GO

    alter table parking_sessions 
       add constraint FK830de5rrsp67txs6evgncua7t 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table parking_zones 
       add constraint FK921gp5sxkvadmxg4x461o0o35 
       foreign key (floor_id) 
       references floors;
GO

    alter table payment_transactions 
       add constraint FKmbh10p93sviw9lg2qv6wv3vwd 
       foreign key (session_id) 
       references parking_sessions;
GO

    alter table pricing_blocks 
       add constraint FKed3mrcu6x99wdaj3dtflfrrrf 
       foreign key (rule_id) 
       references vehicle_pricing_rules;
GO

    alter table pricing_policies 
       add constraint FKqjgocdtfnursim3waus3nq0n6 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table role_permissions 
       add constraint FKegdk29eiy7mdtefy5c7eirr6e 
       foreign key (permission_id) 
       references permissions;
GO

    alter table role_permissions 
       add constraint FKrrrysknip4r04d6fh4plqfwi7 
       foreign key (role_code) 
       references system_roles;
GO

    alter table slots 
       add constraint FKflbnu5ga0lhp9plcy2i8h1irj 
       foreign key (floor_id) 
       references floors;
GO

    alter table slots 
       add constraint FKhtk8ma8toplwtfishoc9pew84 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table slot_status_history 
       add constraint FKcjvqjqrtq48lpq8y3krs9ix54 
       foreign key (changed_by_id) 
       references accounts;
GO

    alter table slot_status_history 
       add constraint FKb7r7odbpfkn9lrdouh8w4enfs 
       foreign key (slot_id) 
       references slots;
GO

    alter table system_configurations 
       add constraint FK8wgivaopegwepp0vksfosi0ev 
       foreign key (last_modified_by) 
       references accounts;
GO

    alter table transaction_details 
       add constraint FKmogmm97sw7kycjgteb9egxxy7 
       foreign key (penalty_id) 
       references penalty_rules;
GO

    alter table transaction_details 
       add constraint FKb0r27o0ixoj9nb1wbhfyrwshr 
       foreign key (service_id) 
       references additional_services;
GO

    alter table transaction_details 
       add constraint FKqp2da373ph8dwpmowe6ej6ade 
       foreign key (session_id) 
       references parking_sessions;
GO

    alter table transaction_details 
       add constraint FK8qmpg0cs50s4syhu73gaqu4ho 
       foreign key (transaction_id) 
       references payment_transactions;
GO

    alter table user_facility_mappings 
       add constraint FKkniuvfwi0ya6e2ol8snnv6tou 
       foreign key (account_id) 
       references accounts;
GO

    alter table user_facility_mappings 
       add constraint FKcxrmlnncbhur8u07vrscs465j 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table user_feedback_tickets 
       add constraint FKnfqysuryik3d6du2dwgpvagg6 
       foreign key (account_id) 
       references accounts;
GO

    alter table user_feedback_tickets 
       add constraint FK12wy1wrmb1tgb2yhl5kjmuopi 
       foreign key (assigned_to_account_id) 
       references accounts;
GO

    alter table user_feedback_tickets 
       add constraint FKgxnsptxvd40xiy1lx28h9hjjy 
       foreign key (booking_id) 
       references bookings;
GO

    alter table user_feedback_tickets 
       add constraint FKs8o4v9p7my23rvoy51mqskqvq 
       foreign key (building_id) 
       references parking_buildings;
GO

    alter table user_feedback_tickets 
       add constraint FK8ixs15wcvj8pc9di7akmv9b4f 
       foreign key (session_id) 
       references parking_sessions;
GO

    alter table user_permissions 
       add constraint FKn1m7dd8h3hodb8vfgmd5tdf0 
       foreign key (account_id) 
       references accounts;
GO

    alter table user_permissions 
       add constraint FKq4qlrabt4s0etm9tfkoqfuib1 
       foreign key (permission_id) 
       references permissions;
GO

    alter table vehicle_pricing_rules 
       add constraint FKsy6xduj9025el2s605i1ori0i 
       foreign key (policy_id) 
       references pricing_policies;
GO

    alter table vehicle_pricing_rules 
       add constraint FKmmtui3yodu715nvqq5agkltih 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table zone_vehicle_types 
       add constraint FK6fjxl3rf2cemsm2vhljvsoiqr 
       foreign key (type_id) 
       references vehicle_types;
GO

    alter table zone_vehicle_types 
       add constraint FKfvjdo6uo8maaetjmdsrvevfwk 
       foreign key (zone_id) 
       references parking_zones;
GO

