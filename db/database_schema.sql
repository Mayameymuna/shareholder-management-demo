-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 18, 2026 at 04:50 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rammis_sms_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `agent_payouts`
--

CREATE TABLE `agent_payouts` (
  `id` int(11) NOT NULL,
  `agent_id` int(11) DEFAULT NULL,
  `amount_withdrawn` decimal(18,2) DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `payout_date` date DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `shareholder_id` varchar(50) DEFAULT NULL,
  `action_type` enum('LOGIN','CREATE','UPDATE','APPROVE','REJECT','DELETE','IMPORT') DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_settings`
--

CREATE TABLE `bank_settings` (
  `id` int(11) NOT NULL,
  `memo_auth_date_gc` date DEFAULT NULL,
  `memo_auth_date_ec` varchar(50) DEFAULT NULL,
  `bank_reg_date_gc` date DEFAULT NULL,
  `bank_reg_place` varchar(100) DEFAULT 'Addis Ababa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `branch_name` varchar(100) NOT NULL,
  `branch_code` varchar(10) NOT NULL,
  `imal_code` varchar(20) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `capital_history`
--

CREATE TABLE `capital_history` (
  `id` int(11) NOT NULL,
  `event_type` enum('INITIAL','INCREASE','REDUCTION','BONUS_ISSUE','STOCK_SPLIT','CONSOLIDATION','CANCELLATION','REDEMPTION','CONVERSION') NOT NULL,
  `authorized_capital` decimal(18,2) NOT NULL,
  `board_resolution_no` varchar(100) DEFAULT NULL,
  `shareholder_resolution_no` varchar(100) DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `share_class_id` int(11) DEFAULT NULL,
  `authorized_shares` bigint(20) DEFAULT NULL,
  `previous_capital` decimal(18,2) DEFAULT 0.00,
  `reg_approval_ref` varchar(100) DEFAULT NULL,
  `action_id` int(11) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `rejection_reason` text DEFAULT NULL,
  `target_capital` decimal(18,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `capital_payments`
--

CREATE TABLE `capital_payments` (
  `id` int(11) NOT NULL,
  `shareholder_id` int(11) NOT NULL,
  `amount_paid` decimal(18,2) NOT NULL,
  `payment_date` date NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `maker_id` varchar(100) DEFAULT NULL,
  `checker_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `service_charge_collected` decimal(18,2) DEFAULT 0.00,
  `agent_commission_calculated` decimal(18,2) DEFAULT 0.00,
  `bank_account_used` varchar(50) DEFAULT NULL,
  `slip_image_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `certificate_no` varchar(50) NOT NULL,
  `shareholder_id` int(11) NOT NULL,
  `share_class_id` int(11) DEFAULT 1,
  `shares_count` int(11) NOT NULL,
  `issue_date` date NOT NULL,
  `status` enum('Active','Cancelled','Lost','Damaged','Replaced','Pending','Rejected','Pending Cancellation') DEFAULT 'Pending',
  `qr_code_data` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `print_status` enum('Not Printed','Printed') DEFAULT 'Not Printed',
  `last_printed_at` timestamp NULL DEFAULT NULL,
  `print_count` int(11) DEFAULT 0,
  `is_electronic` tinyint(1) DEFAULT 1,
  `version_no` int(11) DEFAULT 1,
  `replaced_by` int(11) DEFAULT NULL,
  `re_issued_from` int(11) DEFAULT NULL,
  `re_issue_reason` varchar(255) DEFAULT NULL,
  `police_report_path` varchar(255) DEFAULT NULL,
  `indemnity_form_path` varchar(255) DEFAULT NULL,
  `action_type` enum('ISSUE','RE_ISSUE') DEFAULT 'ISSUE',
  `approved_by` varchar(100) DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` varchar(100) DEFAULT NULL,
  `numbered_from` int(11) DEFAULT NULL,
  `numbered_to` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `certificate_versions`
--

CREATE TABLE `certificate_versions` (
  `id` int(11) NOT NULL,
  `certificate_id` int(11) DEFAULT NULL,
  `version_no` int(11) DEFAULT NULL,
  `action_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `corporate_actions`
--

CREATE TABLE `corporate_actions` (
  `id` int(11) NOT NULL,
  `action_type` enum('BONUS_ISSUE','RIGHTS_ISSUE','SHARE_SPLIT','CONSOLIDATION') NOT NULL,
  `ratio_base` decimal(10,2) NOT NULL,
  `ratio_new` decimal(10,2) NOT NULL,
  `record_date` date NOT NULL,
  `effective_date` date NOT NULL,
  `issue_price` decimal(18,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `board_resolution_no` varchar(100) DEFAULT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `status` enum('Draft','Pending Approval','Executed','Rejected') DEFAULT 'Draft',
  `maker_id` varchar(100) DEFAULT NULL,
  `checker_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `subscription_start_date` date DEFAULT NULL,
  `subscription_end_date` date DEFAULT NULL,
  `board_res_path` varchar(255) DEFAULT NULL,
  `sh_res_path` varchar(255) DEFAULT NULL,
  `reg_approval_path` varchar(255) DEFAULT NULL,
  `capital_value_change` decimal(18,2) DEFAULT 0.00,
  `rejection_reason` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dividend_declarations`
--

CREATE TABLE `dividend_declarations` (
  `id` int(11) NOT NULL,
  `financial_year` varchar(20) NOT NULL,
  `dividend_per_share` decimal(18,4) NOT NULL,
  `record_date` date NOT NULL,
  `payment_date` date DEFAULT NULL,
  `tax_rate_percent` decimal(5,2) DEFAULT 10.00,
  `status` enum('Draft','Calculating','Ready for Approval','Executing','Completed','Rejected') DEFAULT 'Draft',
  `board_res_no` varchar(100) DEFAULT NULL,
  `maker_id` varchar(100) DEFAULT NULL,
  `checker_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `share_class_id` int(11) DEFAULT 1,
  `dividend_type` enum('Interim','Final','Special','Bonus') DEFAULT 'Final',
  `declaration_date` date DEFAULT NULL,
  `ex_dividend_date` date DEFAULT NULL,
  `shareholder_res_no` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dividend_payouts`
--

CREATE TABLE `dividend_payouts` (
  `id` int(11) NOT NULL,
  `declaration_id` int(11) NOT NULL,
  `shareholder_id` int(11) NOT NULL,
  `shares_at_record_date` int(11) NOT NULL,
  `gross_dividend` decimal(18,2) NOT NULL,
  `tax_withheld` decimal(18,2) NOT NULL,
  `net_dividend` decimal(18,2) NOT NULL,
  `payment_status` enum('Unpaid','Processing','Paid','Failed','Returned') DEFAULT 'Unpaid',
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'Bank Transfer',
  `processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_templates`
--

CREATE TABLE `document_templates` (
  `id` int(11) NOT NULL,
  `template_key` varchar(50) DEFAULT NULL,
  `template_name` varchar(100) DEFAULT NULL,
  `subject_line` varchar(255) DEFAULT NULL,
  `body_text` text DEFAULT NULL,
  `footer_text` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `par_value_history`
--

CREATE TABLE `par_value_history` (
  `id` int(11) NOT NULL,
  `share_class_id` int(11) DEFAULT NULL,
  `old_par_value` decimal(18,2) DEFAULT NULL,
  `new_par_value` decimal(18,2) DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `corporate_action_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `shareholder_id` int(11) NOT NULL,
  `amount_paid` decimal(18,2) NOT NULL,
  `shares_covered` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `recorded_by` varchar(100) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rights_applications`
--

CREATE TABLE `rights_applications` (
  `id` int(11) NOT NULL,
  `corporate_action_id` int(11) NOT NULL,
  `shareholder_id` int(11) NOT NULL,
  `shares_requested` int(11) NOT NULL,
  `amount_to_pay` decimal(18,2) NOT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Paid','Allotted','Rejected') DEFAULT 'Pending',
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_name` varchar(50) NOT NULL,
  `permission_key` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_agents`
--

CREATE TABLE `sales_agents` (
  `id` int(11) NOT NULL,
  `agent_name` varchar(150) NOT NULL,
  `agent_code` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `current_balance` decimal(18,2) DEFAULT 0.00,
  `agreement_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sequence_tracker`
--

CREATE TABLE `sequence_tracker` (
  `id` int(11) NOT NULL,
  `doc_type` enum('SHAREHOLDER','ALLOTMENT','CERTIFICATE') NOT NULL,
  `branch_code` varchar(10) NOT NULL,
  `financial_year` varchar(10) NOT NULL,
  `next_sequence` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shareholders`
--

CREATE TABLE `shareholders` (
  `id` int(11) NOT NULL,
  `shareholder_id` varchar(20) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `grand_father_name` varchar(100) DEFAULT NULL,
  `type` enum('Individual','Institutional') NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `nationality` varchar(100) DEFAULT 'Ethiopian',
  `occupation` varchar(255) DEFAULT NULL,
  `id_type` varchar(50) DEFAULT NULL,
  `id_number` varchar(100) DEFAULT NULL,
  `national_id_no` varchar(50) DEFAULT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address_region` varchar(100) DEFAULT NULL,
  `address_city` varchar(100) DEFAULT NULL,
  `address_subcity` varchar(100) DEFAULT NULL,
  `address_woreda` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `status` enum('Active','Pending','Rejected','Pending NBE Approval') DEFAULT 'Pending',
  `registration_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `no_of_share` int(11) DEFAULT 0,
  `no_of_share_birr` decimal(18,2) DEFAULT 0.00,
  `paidup_share` int(11) DEFAULT 0,
  `paidup_birr` decimal(18,2) DEFAULT 0.00,
  `business_reg_no` varchar(100) DEFAULT NULL,
  `license_info` varchar(255) DEFAULT NULL,
  `auth_rep_details` text DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `alt_phone` varchar(20) DEFAULT NULL,
  `postal_address` varchar(100) DEFAULT NULL,
  `kebele` varchar(50) DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'Bank Transfer',
  `payment_status` varchar(50) DEFAULT 'Unpaid',
  `subscription_ref_no` varchar(100) DEFAULT NULL,
  `ownership_percentage` decimal(5,4) DEFAULT 0.0000,
  `id_doc_path` varchar(255) DEFAULT NULL,
  `agreement_doc_path` varchar(255) DEFAULT NULL,
  `payment_doc_path` varchar(255) DEFAULT NULL,
  `draft_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`draft_data`)),
  `action_type` varchar(10) DEFAULT NULL COMMENT 'CREATE or EDIT while Pending',
  `pending_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Proposed changes awaiting approval (EDIT only)' CHECK (json_valid(`pending_data`)),
  `previous_status` varchar(20) DEFAULT NULL COMMENT 'Status to restore if an EDIT is rejected',
  `rejection_reason` text DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `certificate_no` varchar(50) DEFAULT NULL,
  `share_class_id` int(11) DEFAULT 1,
  `subscription_status` enum('Pending','Approved','Completed','Cancelled') DEFAULT 'Pending',
  `branch_name` varchar(100) DEFAULT 'Main Branch',
  `paidup_premium` decimal(18,2) DEFAULT 0.00,
  `service_charge_amt` decimal(18,2) DEFAULT 0.00,
  `is_frozen` tinyint(1) DEFAULT 0,
  `pledged_shares` int(11) DEFAULT 0,
  `under_litigation` tinyint(1) DEFAULT 0,
  `introduced_by` int(11) DEFAULT NULL,
  `is_agent_sale` tinyint(1) DEFAULT 0,
  `agent_id` int(11) DEFAULT NULL,
  `agent_commission_amt` decimal(18,2) DEFAULT 0.00,
  `registration_phase` enum('Pre-Cutoff','Post-Nov-24') DEFAULT 'Pre-Cutoff',
  `nbe_approval_date` date DEFAULT NULL,
  `introducer_name_manual` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_allotments`
--

CREATE TABLE `share_allotments` (
  `id` int(11) NOT NULL,
  `allotment_ref` varchar(50) DEFAULT NULL,
  `shareholder_id` int(11) NOT NULL,
  `share_class_id` int(11) DEFAULT 1,
  `shares_allotted` int(11) NOT NULL,
  `price_per_share` decimal(18,2) DEFAULT 1000.00,
  `total_value` decimal(18,2) NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `amount_paid_at_allotment` decimal(18,2) DEFAULT 0.00,
  `status` enum('Pending Checker','Pending Approval','Approved','Rejected','Returned') DEFAULT 'Pending Checker',
  `maker_id` varchar(100) DEFAULT NULL,
  `checker_id` varchar(100) DEFAULT NULL,
  `approver_id` varchar(100) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `subscription_type` enum('Initial','Additional') DEFAULT 'Initial',
  `payment_status` enum('Full','Partial','Unpaid') DEFAULT 'Full',
  `share_premium_birr` decimal(18,2) DEFAULT 0.00,
  `next_payment_due_date` date DEFAULT NULL,
  `effective_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_classes`
--

CREATE TABLE `share_classes` (
  `id` int(11) NOT NULL,
  `class_name` varchar(50) NOT NULL,
  `par_value` decimal(18,2) DEFAULT 1000.00,
  `voting_rights` varchar(255) DEFAULT NULL,
  `dividend_rights` varchar(255) DEFAULT NULL,
  `transfer_restrictions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `redemption_rights` text DEFAULT NULL,
  `conversion_rights` text DEFAULT NULL,
  `liquidation_priority` int(11) DEFAULT 1,
  `updated_by` varchar(100) DEFAULT NULL,
  `version` int(11) DEFAULT 1,
  `issue_price` decimal(18,2) DEFAULT 1000.00,
  `version_no` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_class_history`
--

CREATE TABLE `share_class_history` (
  `id` int(11) NOT NULL,
  `share_class_id` int(11) DEFAULT NULL,
  `change_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`change_details`)),
  `performed_by` varchar(100) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_transfers`
--

CREATE TABLE `share_transfers` (
  `id` int(11) NOT NULL,
  `transfer_type` enum('TRANSFER','TRANSMISSION') NOT NULL,
  `transferor_id` int(11) NOT NULL,
  `transferee_id` int(11) DEFAULT NULL,
  `shares_count` int(11) NOT NULL,
  `price_per_share` decimal(18,2) DEFAULT 0.00,
  `total_consideration` decimal(18,2) DEFAULT 0.00,
  `reason` varchar(255) DEFAULT NULL,
  `transfer_deed_path` varchar(255) DEFAULT NULL,
  `legal_doc_path` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `maker_id` varchar(100) DEFAULT NULL,
  `checker_id` varchar(100) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `transferee_type` enum('EXISTING','NEW') DEFAULT 'EXISTING',
  `new_transferee_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_transferee_data`)),
  `id_doc_path` varchar(255) DEFAULT NULL,
  `legal_instrument_path` varchar(255) DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `service_fee` decimal(18,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_logs`
--

CREATE TABLE `sms_logs` (
  `id` int(11) NOT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `message_text` text DEFAULT NULL,
  `status` enum('PENDING','SENT','DELIVERED','FAILED','RETRYING') DEFAULT 'PENDING',
  `error_log` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `campaign_id` varchar(50) DEFAULT NULL,
  `provider_msg_id` varchar(100) DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  `last_attempt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_templates`
--

CREATE TABLE `sms_templates` (
  `id` int(11) NOT NULL,
  `template_key` varchar(50) DEFAULT NULL,
  `template_name` varchar(100) DEFAULT NULL,
  `message_body` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff_targets`
--

CREATE TABLE `staff_targets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `target_amount_birr` decimal(18,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `recruitment_target` int(11) DEFAULT 5,
  `fiscal_year` varchar(10) DEFAULT '2026',
  `quarter` int(11) DEFAULT 1,
  `campaign_name` varchar(100) DEFAULT 'General Sales'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_parameters`
--

CREATE TABLE `system_parameters` (
  `param_key` varchar(50) NOT NULL,
  `param_value` varchar(255) DEFAULT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_permissions`
--

CREATE TABLE `system_permissions` (
  `id` int(11) NOT NULL,
  `permission_key` varchar(100) DEFAULT NULL,
  `permission_name` varchar(100) DEFAULT NULL,
  `module_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `mustUpdatePassword` tinyint(1) DEFAULT 1,
  `role` enum('Admin','Maker','Checker','Auditor','Compliance') DEFAULT 'Maker',
  `is_active` tinyint(1) DEFAULT 1,
  `delegated_to` int(11) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT 'Main Branch'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `agent_payouts`
--
ALTER TABLE `agent_payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bank_settings`
--
ALTER TABLE `bank_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branch_name` (`branch_name`),
  ADD UNIQUE KEY `branch_code` (`branch_code`);

--
-- Indexes for table `capital_history`
--
ALTER TABLE `capital_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `capital_payments`
--
ALTER TABLE `capital_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_no` (`reference_no`),
  ADD UNIQUE KEY `idx_unique_receipt` (`reference_no`),
  ADD KEY `shareholder_id` (`shareholder_id`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `certificate_no` (`certificate_no`),
  ADD KEY `shareholder_id` (`shareholder_id`);

--
-- Indexes for table `certificate_versions`
--
ALTER TABLE `certificate_versions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `certificate_id` (`certificate_id`);

--
-- Indexes for table `corporate_actions`
--
ALTER TABLE `corporate_actions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dividend_declarations`
--
ALTER TABLE `dividend_declarations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dividend_payouts`
--
ALTER TABLE `dividend_payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `declaration_id` (`declaration_id`),
  ADD KEY `idx_sh_payouts` (`shareholder_id`);

--
-- Indexes for table `document_templates`
--
ALTER TABLE `document_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `template_key` (`template_key`);

--
-- Indexes for table `par_value_history`
--
ALTER TABLE `par_value_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shareholder_id` (`shareholder_id`);

--
-- Indexes for table `rights_applications`
--
ALTER TABLE `rights_applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `corporate_action_id` (`corporate_action_id`),
  ADD KEY `shareholder_id` (`shareholder_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_name`,`permission_key`);

--
-- Indexes for table `sales_agents`
--
ALTER TABLE `sales_agents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `agent_code` (`agent_code`);

--
-- Indexes for table `sequence_tracker`
--
ALTER TABLE `sequence_tracker`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `doc_type` (`doc_type`,`branch_code`,`financial_year`);

--
-- Indexes for table `shareholders`
--
ALTER TABLE `shareholders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shareholder_id` (`shareholder_id`),
  ADD KEY `idx_subscription` (`subscription_status`),
  ADD KEY `fk_share_class` (`share_class_id`),
  ADD KEY `fk_introduced_by` (`introduced_by`),
  ADD KEY `fk_shareholder_agent` (`agent_id`);

--
-- Indexes for table `share_allotments`
--
ALTER TABLE `share_allotments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `allotment_ref` (`allotment_ref`),
  ADD KEY `shareholder_id` (`shareholder_id`);

--
-- Indexes for table `share_classes`
--
ALTER TABLE `share_classes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `share_class_history`
--
ALTER TABLE `share_class_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `share_transfers`
--
ALTER TABLE `share_transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transferor_id` (`transferor_id`),
  ADD KEY `transferee_id` (`transferee_id`);

--
-- Indexes for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sms_status` (`status`);

--
-- Indexes for table `sms_templates`
--
ALTER TABLE `sms_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `template_key` (`template_key`);

--
-- Indexes for table `staff_targets`
--
ALTER TABLE `staff_targets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_staff_period` (`user_id`,`fiscal_year`,`quarter`);

--
-- Indexes for table `system_parameters`
--
ALTER TABLE `system_parameters`
  ADD PRIMARY KEY (`param_key`);

--
-- Indexes for table `system_permissions`
--
ALTER TABLE `system_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permission_key` (`permission_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agent_payouts`
--
ALTER TABLE `agent_payouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_settings`
--
ALTER TABLE `bank_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `capital_history`
--
ALTER TABLE `capital_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `capital_payments`
--
ALTER TABLE `capital_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `certificate_versions`
--
ALTER TABLE `certificate_versions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `corporate_actions`
--
ALTER TABLE `corporate_actions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dividend_declarations`
--
ALTER TABLE `dividend_declarations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dividend_payouts`
--
ALTER TABLE `dividend_payouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_templates`
--
ALTER TABLE `document_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `par_value_history`
--
ALTER TABLE `par_value_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rights_applications`
--
ALTER TABLE `rights_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_agents`
--
ALTER TABLE `sales_agents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sequence_tracker`
--
ALTER TABLE `sequence_tracker`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shareholders`
--
ALTER TABLE `shareholders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `share_allotments`
--
ALTER TABLE `share_allotments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `share_classes`
--
ALTER TABLE `share_classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `share_class_history`
--
ALTER TABLE `share_class_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `share_transfers`
--
ALTER TABLE `share_transfers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_logs`
--
ALTER TABLE `sms_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_templates`
--
ALTER TABLE `sms_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_targets`
--
ALTER TABLE `staff_targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_permissions`
--
ALTER TABLE `system_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agent_payouts`
--
ALTER TABLE `agent_payouts`
  ADD CONSTRAINT `agent_payouts_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `sales_agents` (`id`);

--
-- Constraints for table `capital_payments`
--
ALTER TABLE `capital_payments`
  ADD CONSTRAINT `capital_payments_ibfk_1` FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders` (`id`);

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders` (`id`);

--
-- Constraints for table `certificate_versions`
--
ALTER TABLE `certificate_versions`
  ADD CONSTRAINT `certificate_versions_ibfk_1` FOREIGN KEY (`certificate_id`) REFERENCES `certificates` (`id`);

--
-- Constraints for table `dividend_payouts`
--
ALTER TABLE `dividend_payouts`
  ADD CONSTRAINT `dividend_payouts_ibfk_1` FOREIGN KEY (`declaration_id`) REFERENCES `dividend_declarations` (`id`),
  ADD CONSTRAINT `dividend_payouts_ibfk_2` FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders` (`id`);

--
-- Constraints for table `rights_applications`
--
ALTER TABLE `rights_applications`
  ADD CONSTRAINT `rights_applications_ibfk_1` FOREIGN KEY (`corporate_action_id`) REFERENCES `corporate_actions` (`id`),
  ADD CONSTRAINT `rights_applications_ibfk_2` FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders` (`id`);

--
-- Constraints for table `shareholders`
--
ALTER TABLE `shareholders`
  ADD CONSTRAINT `fk_introduced_by` FOREIGN KEY (`introduced_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_share_class` FOREIGN KEY (`share_class_id`) REFERENCES `share_classes` (`id`),
  ADD CONSTRAINT `fk_shareholder_agent` FOREIGN KEY (`agent_id`) REFERENCES `sales_agents` (`id`);

--
-- Constraints for table `share_allotments`
--
ALTER TABLE `share_allotments`
  ADD CONSTRAINT `share_allotments_ibfk_1` FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders` (`id`);

--
-- Constraints for table `share_transfers`
--
ALTER TABLE `share_transfers`
  ADD CONSTRAINT `share_transfers_ibfk_1` FOREIGN KEY (`transferor_id`) REFERENCES `shareholders` (`id`),
  ADD CONSTRAINT `share_transfers_ibfk_2` FOREIGN KEY (`transferee_id`) REFERENCES `shareholders` (`id`);

--
-- Constraints for table `staff_targets`
--
ALTER TABLE `staff_targets`
  ADD CONSTRAINT `staff_targets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
