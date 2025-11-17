import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../../../core/services/customer_service_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../widgets/ticket_item.dart';

/// Support tickets page
class SupportTicketsPage extends ConsumerStatefulWidget {
  const SupportTicketsPage({super.key});

  @override
  ConsumerState<SupportTicketsPage> createState() => _SupportTicketsPageState();
}

class _SupportTicketsPageState extends ConsumerState<SupportTicketsPage>
    with SingleTickerProviderStateMixin {
  final CustomerServiceService _supportService = CustomerServiceService();
  List<CustomerServiceModel> _tickets = [];
  bool _isLoading = true;
  String? _error;
  String? _selectedStatus;

  late TabController _tabController;
  final List<String> _tabs = ['All', 'Open', 'Resolved', 'Closed'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadTickets();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    setState(() {
      _selectedStatus = _tabController.index == 0
          ? null
          : _tabs[_tabController.index].toLowerCase();
      _tickets.clear();
    });
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final tickets = await _supportService.getMyTickets(
        status: _selectedStatus,
        page: 1,
        limit: 50,
      );

      setState(() {
        _tickets = tickets;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshTickets() async {
    setState(() {
      _tickets.clear();
    });
    await _loadTickets();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Support Tickets'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () {
              Navigator.pushNamed(context, '/support/faq');
            },
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createNewTicket,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null) {
      return Center(
        child: AppErrorWidget(
          message: _error!,
          onRetry: _loadTickets,
        ),
      );
    }

    if (_tickets.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refreshTickets,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tickets.length,
        itemBuilder: (context, index) {
          final ticket = _tickets[index];
          return TicketItem(
            ticket: ticket,
            onTap: () => _openTicket(ticket),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.support_agent,
            size: 80,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No support tickets',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Need help? Create a new ticket',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  void _openTicket(CustomerServiceModel ticket) {
    Navigator.pushNamed(
      context,
      '/support/tickets/${ticket.id}',
      arguments: ticket,
    ).then((_) {
      _refreshTickets();
    });
  }

  void _createNewTicket() {
    Navigator.pushNamed(context, '/support/tickets/new').then((_) {
      _refreshTickets();
    });
  }
}
