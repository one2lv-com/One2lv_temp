Name: one2lvos_ix
Version: 5.0
Release: 1%{?dist}
Summary: one2lvos_ix atomic recovery-first runtime
BuildArch: noarch

%description
one2lvos_ix boot runtime with module system, recovery flow, logging, and web loader.

%install
mkdir -p %{buildroot}/usr/local/bin
mkdir -p %{buildroot}/usr/local/lib/one2lvos_ix
cp -r bin lib modules modules.conf backend frontend docs workspace packaging tools install.sh start.sh rebuild.sh package.json .env.example README.md %{buildroot}/usr/local/lib/one2lvos_ix
ln -s /usr/local/lib/one2lvos_ix/bin/one2lvos_ix %{buildroot}/usr/local/bin/one2lvos_ix

%files
/usr/local/bin/one2lvos_ix
/usr/local/lib/one2lvos_ix
